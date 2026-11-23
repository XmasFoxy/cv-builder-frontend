import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { getEmployees } from "./employees-data";
import Loading from "./loading";
import EmployeesPage from "./page";

vi.mock("./employees-data", () => ({ getEmployees: vi.fn() }));

it("renders the specified columns with employee data and initials", async () => {
  vi.mocked(getEmployees).mockResolvedValueOnce({
    items: [
      {
        id: "1",
        email: "ada@example.test",
        profile: { first_name: "Ada", last_name: "Lovelace", avatar: "https://example.test/ada.jpg" },
        department: { name: "Engineering" },
        position: { name: "Developer" },
      },
      {
        id: "2",
        email: "grace@example.test",
        profile: { first_name: null, last_name: null, avatar: null },
        department: null,
        position: null,
      },
    ],
    total: 3,
  });
  render(await EmployeesPage());

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Avatar", "First Name", "Last Name", "Email", "Department", "Position",
  ]);
  const ada = screen.getByRole("row", { name: /ada@example.test/ });
  const adaCells = within(ada).getAllByRole("cell");
  const avatar = adaCells[0].querySelector("img");
  if (!avatar) throw new Error("Expected an image for Ada");
  expect(avatar).toHaveAttribute("src", "https://example.test/ada.jpg");
  fireEvent.load(avatar);
  expect(within(adaCells[0]).queryByText("A")).not.toBeInTheDocument();
  fireEvent.error(avatar);
  expect(within(adaCells[0]).getByText("A")).toBeInTheDocument();
  expect(adaCells.slice(1).map((cell) => cell.textContent)).toEqual([
    "Ada", "Lovelace", "ada@example.test", "Engineering", "Developer",
  ]);

  const grace = screen.getByRole("row", { name: /grace@example.test/ });
  const graceCells = within(grace).getAllByRole("cell");
  expect(within(graceCells[0]).getByText("G")).toBeInTheDocument();
  expect(graceCells.slice(1).map((cell) => cell.textContent)).toEqual([
    "", "", "grace@example.test", "", "",
  ]);
  expect(screen.getByText("Showing 2 of 3 employees")).toBeInTheDocument();
});

it("shows the empty state inside the table", async () => {
  vi.mocked(getEmployees).mockResolvedValueOnce({ items: [], total: 0 });
  render(await EmployeesPage());

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getByRole("cell", { name: "No users found" })).toHaveAttribute("colspan", "6");
});

it("keeps the table headers visible while loading employees", () => {
  render(<Loading />);

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
  expect(within(table).getByRole("status")).toHaveTextContent("Loading employees…");
});

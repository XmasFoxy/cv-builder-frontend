import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { getEmployees } from "./employees-data";
import Loading from "./loading";
import { EmployeesResults } from "./employees-results";

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
    total: 2,
    page: 1,
    limit: 10,
    total_pages: 1,
  });
  render(await EmployeesResults({ page: 1, search: "" }));

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
  expect(screen.queryByRole("navigation", { name: "Employees pagination" })).not.toBeInTheDocument();
});

it("shows the empty state inside the table", async () => {
  vi.mocked(getEmployees).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 10, total_pages: 0 });
  render(await EmployeesResults({ page: 1, search: "missing" }));

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getByRole("cell", { name: "No users found" })).toHaveAttribute("colspan", "6");
});

it("keeps the table headers visible while loading employees", () => {
  render(<Loading />);

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
  expect(within(table).getByRole("status")).toHaveTextContent("Loading employees…");
});

it("uses the API page and limit and keeps the search in pagination links", async () => {
  const employee = {
    id: "3",
    email: "ada+team@example.test",
    profile: { first_name: "Ada", last_name: "Lovelace", avatar: null },
    department: null,
    position: null,
  };
  vi.mocked(getEmployees).mockResolvedValueOnce({
    items: [employee, { ...employee, id: "4" }],
    total: 6,
    page: 2,
    limit: 2,
    total_pages: 3,
  });
  render(await EmployeesResults({ page: 2, search: "ada+team" }));

  expect(getEmployees).toHaveBeenLastCalledWith({ page: 2, search: "ada+team" });
  expect(screen.getByText("Showing 3–4 of 6 employees")).toBeInTheDocument();
  const pagination = screen.getByRole("navigation", { name: "Employees pagination" });
  expect(within(pagination).getByText("Page 2 of 3")).toHaveAttribute("aria-current", "page");
  expect(within(pagination).getByRole("link", { name: "Previous" }))
    .toHaveAttribute("href", "/employees?search=ada%2Bteam");
  expect(within(pagination).getByRole("link", { name: "Next" }))
    .toHaveAttribute("href", "/employees?search=ada%2Bteam&page=3");
});

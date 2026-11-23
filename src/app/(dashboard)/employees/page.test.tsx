import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { getEmployees } from "./employees-data";
import Loading from "./loading";
import { EmployeesResults } from "./employees-results";
import { EmployeesRows, EmployeesTable } from "./employees-table";
import { readEmployeesSort } from "./employees-url";

vi.mock("./employees-data", () => ({ getEmployees: vi.fn() }));

it("renders the specified columns with employee data and initials", () => {
  const items = [
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
  ];
  render(<EmployeesTable><EmployeesRows items={items} /></EmployeesTable>);

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

it("shows the empty state inside the table", () => {
  render(<EmployeesTable><EmployeesRows items={[]} /></EmployeesTable>);

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getByRole("cell", { name: "No users found" })).toHaveAttribute("colspan", "6");
});

it("keeps the table headers visible while loading employees", () => {
  render(<Loading />);

  const table = screen.getByRole("table", { name: "Employees" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
  expect(within(table).getByRole("status")).toHaveTextContent("Loading employees…");
});

it("uses the API page and limit and keeps search and sort in pagination links", async () => {
  const employee = {
    id: "3",
    email: "ada+team@example.test",
    profile: { first_name: "Ada", last_name: "Lovelace", avatar: null },
    department: null,
    position: null,
  };
  vi.mocked(getEmployees).mockResolvedValue({
    items: [employee, { ...employee, id: "4" }],
    total: 6,
    page: 2,
    limit: 2,
    total_pages: 3,
  });
  const sort = { sort_by: "last_name", sort_order: "DESC" } as const;
  const query = { page: 2, search: "ada+team", sort };
  const stream = await renderToReadableStream(<EmployeesResults query={query} />);
  await stream.allReady;
  const markup = await new Response(stream).text();
  const results = document.createElement("div");
  results.innerHTML = markup;

  expect(getEmployees).toHaveBeenLastCalledWith(query);
  expect(within(results).getByText(/Showing/)).toHaveTextContent("Showing 3–4 of 6 employees");
  const pagination = within(results).getByRole("navigation", { name: "Employees pagination" });
  expect(within(pagination).getByText("Page 2 of 3")).toHaveAttribute("aria-current", "page");
  expect(within(pagination).getByRole("link", { name: "Previous" }))
    .toHaveAttribute("href", "/employees?search=ada%2Bteam&sort_by=last_name&sort_order=DESC");
  expect(within(pagination).getByRole("link", { name: "Next" }))
    .toHaveAttribute("href", "/employees?search=ada%2Bteam&page=3&sort_by=last_name&sort_order=DESC");
});

it("marks the active sort and links to page one with the search intact", () => {
  render(<EmployeesTable search="Ada Lovelace" sort={{ sort_by: "first_name", sort_order: "ASC" }} />);

  const firstName = screen.getByRole("columnheader", { name: /First Name/ });
  const lastName = screen.getByRole("columnheader", { name: /Last Name/ });
  expect(firstName).toHaveAttribute("aria-sort", "ascending");
  expect(lastName).not.toHaveAttribute("aria-sort");
  expect(within(firstName).getByRole("link", { name: "First Name, sort descending" }))
    .toHaveAttribute("href", "/employees?search=Ada+Lovelace&sort_by=first_name&sort_order=DESC");
  expect(within(lastName).getByRole("link", { name: "Last Name, sort ascending" }))
    .toHaveAttribute("href", "/employees?search=Ada+Lovelace&sort_by=last_name&sort_order=ASC");
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

it.each([
  ["department", "ASC"],
  ["position", "DESC"],
  ["first_name", "up"],
  ["last_name", undefined],
  [["first_name", "last_name"], "DESC"],
  ["first_name", ["ASC", "DESC"]],
])("ignores unsupported or ambiguous sort parameters (%s, %s)", (field, direction) => {
  expect(readEmployeesSort(field, direction)).toBeUndefined();
});

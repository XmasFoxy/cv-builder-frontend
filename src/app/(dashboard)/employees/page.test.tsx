import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { getEmployees } from "./employees-data";
import EmployeesPage from "./page";

vi.mock("./employees-data", () => ({ getEmployees: vi.fn() }));

it("renders employees returned by the API and indicates when there are more", async () => {
  vi.mocked(getEmployees).mockResolvedValueOnce({
    items: [{ id: "1", email: "employee@example.test" }],
    total: 2,
  });
  render(await EmployeesPage());

  expect(screen.getByRole("listitem")).toHaveTextContent("employee@example.test");
  expect(screen.getByText("Showing 1 of 2 employees")).toBeInTheDocument();
});

it("shows the empty state when the API returns no employees", async () => {
  vi.mocked(getEmployees).mockResolvedValueOnce({ items: [], total: 0 });
  render(await EmployeesPage());

  expect(screen.getByText("No employees found.")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

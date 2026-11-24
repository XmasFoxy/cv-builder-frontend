import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { getEmployeeProfile, type EmployeeProfile } from "./employee-profile-data";
import { EmployeeProfileDetails } from "./employee-profile";
import { EmployeeDetailsLoading } from "./employee-details-loading";
import EmployeeProfilePage from "./page";
import { RetryButton } from "@/components/layout/retry-button";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./employee-profile-data", () => ({ getEmployeeProfile: vi.fn() }));

const employee: EmployeeProfile = {
  id: "17",
  email: "ada@example.test",
  created_at: "1705190400000",
  profile: { first_name: "Ada", last_name: "Lovelace", avatar: "https://example.test/ada.jpg" },
  department: { name: "Frontend" },
  position: { name: "Software Engineer" },
};

async function renderProfilePage(params: Record<string, string> = {}) {
  const page = await EmployeeProfilePage({
    params: Promise.resolve({ employeeId: employee.id }),
    searchParams: Promise.resolve(params),
  });
  const stream = await renderToReadableStream(page);
  await stream.allReady;
  const { container } = render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
  return within(container);
}

it("renders the selected employee and links back to the same filtered, sorted page", async () => {
  vi.mocked(getEmployeeProfile).mockResolvedValueOnce({ status: "found", data: { user: employee } });
  const params = { search: "ada+team", page: "2", sort_by: "last_name", sort_order: "DESC" };
  const page = await renderProfilePage(params);

  expect(getEmployeeProfile).toHaveBeenLastCalledWith("17", {
    search: "ada+team",
    page: 2,
    sort: { sort_by: "last_name", sort_order: "DESC" },
  });
  expect(page.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute(
    "href",
    "/employees?search=ada%2Bteam&page=2&sort_by=last_name&sort_order=DESC",
  );
  const tabs = within(page.getByRole("navigation", { name: "Employee profile" }));
  expect(tabs.getByRole("link", { name: "Profile", current: "page" })).toBeInTheDocument();
  expect(tabs.getByRole("link", { name: "Skills" })).toHaveAttribute(
    "href", "/employees/17/skills?search=ada%2Bteam&page=2&sort_by=last_name&sort_order=DESC",
  );
  expect(page.getByText(employee.email)).toBeInTheDocument();
  expect(page.getByText("January 14, 2024")).toHaveAttribute("datetime", "2024-01-14T00:00:00.000Z");
  expect(page.getAllByRole("term").map((field) => field.textContent)).toEqual([
    "First Name", "Last Name", "Department", "Position",
  ]);
  expect(page.getAllByRole("definition").map((field) => field.textContent)).toEqual([
    "Ada", "Lovelace", "Frontend", "Software Engineer",
  ]);
  expect(page.queryByRole("textbox")).not.toBeInTheDocument();
  expect(page.queryByRole("button")).not.toBeInTheDocument();
});

it("shows the avatar and falls back to initials if the image fails", () => {
  const { container } = render(<EmployeeProfileDetails employee={employee} name="Ada Lovelace" />);
  const avatar = container.querySelector("img");
  if (!avatar) throw new Error("Expected a profile avatar");
  expect(avatar).toHaveAttribute("src", employee.profile.avatar);
  fireEvent.load(avatar);
  expect(screen.queryByText("AL")).not.toBeInTheDocument();
  fireEvent.error(avatar);
  expect(screen.getByText("AL")).toBeInTheDocument();
});

it("falls back to email and placeholders for incomplete profiles", async () => {
  vi.mocked(getEmployeeProfile).mockResolvedValueOnce({
    status: "found",
    data: { user: {
      ...employee,
      created_at: "",
      profile: { first_name: null, last_name: null, avatar: null },
      department: null,
      position: null,
    } },
  });
  const page = await renderProfilePage();

  expect(page.getByRole("heading", { name: employee.email })).toBeInTheDocument();
  expect(page.getByText("A")).toBeInTheDocument();
  expect(page.getByText("Member since date unavailable")).toBeInTheDocument();
  expect(page.getAllByText("Not provided")).toHaveLength(4);
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees");
});

it("announces loading while waiting for the server", () => {
  render(<EmployeeDetailsLoading tab="profile" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading profile…");
});

it("keeps the return link when the employee is missing", async () => {
  vi.mocked(getEmployeeProfile).mockResolvedValueOnce({ status: "missing" });
  const page = await renderProfilePage({ page: "2" });

  expect(page.getByRole("heading", { name: "Employee not found" })).toBeInTheDocument();
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees?page=2");
  expect(page.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});

it("offers Retry on a load failure and refreshes the current profile route", async () => {
  vi.mocked(getEmployeeProfile).mockResolvedValueOnce({ status: "unavailable" });
  const page = await renderProfilePage({ page: "2" });
  expect(page.getByRole("heading", { name: "Failed to load profile information" })).toBeInTheDocument();
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees?page=2");
  expect(page.getByRole("button", { name: "Retry" })).toBeInTheDocument();

  const { container } = render(<RetryButton />);
  fireEvent.click(within(container).getByRole("button", { name: "Retry" }));
  expect(refresh).toHaveBeenCalledOnce();
});

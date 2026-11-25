import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { CvDetailsFrame } from "./cv-details-frame";
import { CvProjects } from "./cv-projects";
import { changeCvProject } from "./cv-projects-actions";
import type { CatalogProject, CvProject, ProjectsQuery } from "./cv-projects-model";

vi.mock("./cv-projects-actions", () => ({ changeCvProject: vi.fn() }));

const studio: CatalogProject = {
  id: "10", name: "Media Studio", domain: "Entertainment", description: "Production service",
  environment: ["React", "PostgreSQL"], start_date: "2024-01-01", end_date: "2024-12-31",
};
const sales: CatalogProject = {
  ...studio, id: "20", name: "Sales Dashboard", domain: "FinTech", start_date: "2024-04-01", end_date: null,
};
const other = { ...studio, id: "30", name: "Unassigned" };
const first: CvProject = {
  id: "31", project: studio, start_date: "2024-02-01", end_date: "2024-12-03",
  roles: ["Legacy Designer"], responsibilities: ["Review changes"],
};
const second: CvProject = {
  id: "32", project: sales, start_date: "2024-06-02", end_date: null, roles: ["Developer"], responsibilities: [],
};
const options = { projects: [studio, sales, other], roles: ["Developer", "Tester"] };
const defaultQuery: ProjectsQuery = { search: "", sort: "end_date", direction: "desc" };

function view(items = [first, second], initialQuery = defaultQuery) {
  return <CvProjects cvId="7" items={items} options={options} initialQuery={initialQuery} />;
}

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/cvs/7/projects?search=Frontend&page=2");
});

it("marks Projects active and keeps the list context in the shared layout", () => {
  render(<CvDetailsFrame cvId="7" name="Frontend CV" query={{ search: "Frontend", page: 2, sortOrder: "ASC" }} tab="Projects">
    {view()}
  </CvDetailsFrame>);
  const sections = screen.getByRole("navigation", { name: "CV sections" });
  expect(within(sections).getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
  expect(within(sections).getByRole("link", { name: "Details" })).toHaveAttribute("href", "/cvs/7?search=Frontend&page=2");
  expect(screen.getByRole("link", { name: "CVs" })).toHaveAttribute("href", "/cvs?search=Frontend&page=2");
});

it("filters only assigned projects by name and domain and sorts with URL state", async () => {
  const user = userEvent.setup();
  render(view());
  const table = within(screen.getByRole("table", { name: "CV projects" }));
  expect(table.getByRole("columnheader", { name: /responsibilities/i })).toBeVisible();
  expect(table.getByText("Review changes")).toBeVisible();
  expect(table.queryByText("Unassigned")).not.toBeInTheDocument();

  const search = screen.getByRole("searchbox");
  await user.type(search, "FINTECH");
  expect(table.getByText("Sales Dashboard")).toBeVisible();
  expect(table.queryByText("Media Studio")).not.toBeInTheDocument();
  expect(window.location.search).toContain("project_search=FINTECH");
  expect(window.location.search).toContain("search=Frontend");
  await user.clear(search);
  await user.type(search, "STUDIO");
  expect(table.getByText("Media Studio")).toBeVisible();
  await user.type(search, " absent");
  expect(table.getByText("No projects found")).toBeVisible();
  await user.clear(search);

  const rows = () => table.getAllByRole("button", { name: /actions for/i }).map((button) => button.getAttribute("aria-label"));
  await user.click(table.getByRole("button", { name: "Start Date, sort ascending" }));
  expect(rows()).toEqual(["Actions for Media Studio", "Actions for Sales Dashboard"]);
  await user.click(table.getByRole("button", { name: "Start Date, sort descending" }));
  expect(rows()).toEqual(["Actions for Sales Dashboard", "Actions for Media Studio"]);
  expect(window.location.search).toContain("project_sort=start_date");
  expect(table.getByRole("columnheader", { name: /start date/i })).toHaveAttribute("aria-sort", "descending");

  await user.click(table.getByRole("button", { name: "Name, sort ascending" }));
  expect(rows()[0]).toBe("Actions for Media Studio");
  await user.click(table.getByRole("button", { name: "End Date, sort ascending" }));
  expect(rows()[0]).toBe("Actions for Media Studio");
});

it("prefills catalog fields, validates dates and roles, and preserves the form on a failed add", async () => {
  const user = userEvent.setup();
  const { rerender } = render(view([]));
  expect(screen.getByText("No projects added yet")).toBeVisible();
  vi.mocked(changeCvProject).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("saved");
  await user.click(screen.getByRole("button", { name: "Add project" }));
  const dialog = within(screen.getByRole("dialog", { name: "Add project" }));
  const select = dialog.getByRole("combobox", { name: "Name" });
  const add = dialog.getByRole("button", { name: "Add" });
  expect(add).toBeDisabled();
  await user.selectOptions(select, studio.id);
  expect(dialog.getByLabelText("Domain")).toBeDisabled();
  expect(dialog.getByLabelText("Domain")).toHaveValue("Entertainment");
  expect(dialog.getByLabelText("Description")).toBeDisabled();
  expect(dialog.getByLabelText("Description")).toHaveValue("Production service");
  expect(dialog.getByLabelText("Environment")).toBeDisabled();
  expect(dialog.getByLabelText("Environment")).toHaveValue("React, PostgreSQL");
  const start = dialog.getByLabelText("Start Date");
  const end = dialog.getByLabelText("End Date");
  expect(start).toHaveValue("2024-01-01");
  expect(end).toHaveAttribute("max", "2024-12-31");

  const developer = dialog.getByRole("checkbox", { name: "Developer" });
  await user.click(developer);
  await user.click(developer);
  expect(dialog.getByText("At least one role must be selected")).toBeVisible();
  expect(add).toBeDisabled();
  await user.click(developer);
  await user.click(dialog.getByRole("checkbox", { name: "Tester" }));

  fireEvent.change(start, { target: { value: "2023-12-31" } });
  expect(start).toHaveAccessibleDescription(/start date must be within project duration/i);
  expect(add).toBeDisabled();
  fireEvent.change(start, { target: { value: "2024-02-01" } });
  fireEvent.change(end, { target: { value: "2024-01-31" } });
  expect(end).toHaveAccessibleDescription(/end date cannot be earlier than start date/i);
  fireEvent.change(end, { target: { value: "2025-01-01" } });
  expect(end).toHaveAccessibleDescription(/end date must be within project duration/i);
  fireEvent.change(end, { target: { value: "" } });

  const responsibilities = dialog.getByLabelText("Responsibilities");
  await user.type(responsibilities, "Build screens{Enter}Review changes");
  await user.click(add);
  expect(await dialog.findByRole("alert")).toHaveTextContent("Failed to add project");
  expect(responsibilities).toHaveValue("Build screens\nReview changes");
  expect(developer).toBeChecked();
  await user.click(add);
  expect(changeCvProject).toHaveBeenLastCalledWith("7", {
    action: "add", projectId: "10", start_date: "2024-02-01", end_date: null,
    roles: ["Developer", "Tester"], responsibilities: ["Build screens", "Review changes"],
  });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(view([first]));
  expect(screen.getByText("Media Studio")).toBeVisible();
});

it("updates a legacy assignment, links server validation to the field and confirms removal", async () => {
  const user = userEvent.setup();
  vi.mocked(changeCvProject).mockResolvedValueOnce("projectRoleUnavailable").mockResolvedValueOnce("saved").mockResolvedValueOnce("saved");
  const { rerender } = render(view([first]));
  const trigger = screen.getByRole("button", { name: "Actions for Media Studio" });
  trigger.focus();
  await user.keyboard("{Enter}");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("menuitem", { name: "Update" }));
  const update = within(screen.getByRole("dialog", { name: "Update project" }));
  expect(update.getByRole("combobox", { name: "Name" })).toBeDisabled();
  expect(update.getByRole("combobox", { name: "Name" })).toHaveValue("10");
  expect(update.getByRole("checkbox", { name: "Legacy Designer" })).toBeChecked();
  const save = update.getByRole("button", { name: "Save" });
  expect(save).toBeDisabled();
  await user.click(update.getByRole("checkbox", { name: "Tester" }));
  await user.click(save);
  expect(await update.findByRole("alert")).toHaveTextContent("A selected role is no longer available");
  await user.click(update.getByRole("checkbox", { name: "Tester" }));
  await user.click(update.getByRole("checkbox", { name: "Developer" }));
  await user.click(save);
  expect(changeCvProject).toHaveBeenLastCalledWith("7", {
    action: "update", projectId: "10", start_date: "2024-02-01", end_date: "2024-12-03",
    roles: ["Legacy Designer", "Developer"], responsibilities: ["Review changes"],
  });
  await waitFor(() => expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull());
  await waitFor(() => expect(trigger).toHaveFocus());

  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  let remove = within(screen.getByRole("dialog", { name: "Remove project" }));
  expect(remove.getByText("Are you sure you want to remove project Media Studio?")).toBeVisible();
  await user.click(remove.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull());
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(changeCvProject).toHaveBeenCalledTimes(2);

  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  remove = within(screen.getByRole("dialog", { name: "Remove project" }));
  await user.click(remove.getByRole("button", { name: "Confirm" }));
  expect(changeCvProject).toHaveBeenLastCalledWith("7", { action: "remove", projectId: "10" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(view([]));
  expect(screen.getByText("No projects added yet")).toBeVisible();
  await waitFor(() => expect(screen.getByRole("searchbox")).toHaveFocus());
});

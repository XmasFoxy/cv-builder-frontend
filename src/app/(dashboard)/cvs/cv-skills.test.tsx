import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import type { EmployeeSkill } from "../employees/[employeeId]/employee-profile-data";
import { CvDetailsFrame } from "./cv-details-frame";
import { changeCvSkills } from "./cv-skills-actions";
import { CvSkills } from "./cv-skills";

vi.mock("./cv-skills-actions", () => ({ changeCvSkills: vi.fn() }));

const react: EmployeeSkill = { name: "React", categoryId: "1", mastery: "Expert" };
const postgres: EmployeeSkill = { name: "PostgreSQL", categoryId: "2", mastery: "Proficient" };
const vue: EmployeeSkill = { name: "Vue", categoryId: "1", mastery: "Advanced" };
const git: EmployeeSkill = { name: "Git", categoryId: "legacy", mastery: "Novice" };
const categories = [
  { id: "2", name: "Databases", order: 20 },
  { id: "3", name: "Backend", order: 30 },
  { id: "1", name: "Frontend", order: 10 },
];

function skillsView(skills: EmployeeSkill[] = [postgres, react, git]) {
  return <CvSkills cvId="7" skills={skills} ownerSkills={[react, vue, postgres]} categories={categories} />;
}

beforeEach(() => vi.resetAllMocks());

it("uses linked CV sections and preserves list filters and the active page", () => {
  const query = { search: "Frontend Engineer", page: 2, sortOrder: "DESC" } as const;
  const suffix = "?search=Frontend+Engineer&page=2&sort_by=name&sort_order=DESC";
  const { rerender } = render(<CvDetailsFrame cvId="7" query={query} name="Frontend CV">Details form</CvDetailsFrame>);
  const sections = screen.getByRole("navigation", { name: "CV sections" });
  expect(within(sections).getByRole("link", { name: "Details" })).toHaveAttribute("aria-current", "page");
  expect(within(sections).getByRole("link", { name: "Skills" })).toHaveAttribute("href", "/cvs/7/skills" + suffix);
  expect(within(sections).getByText("Projects")).toHaveAttribute("aria-disabled", "true");
  expect(within(sections).getByText("Preview")).toHaveAttribute("aria-disabled", "true");

  rerender(<CvDetailsFrame cvId="7" query={query} name="Frontend CV" tab="Skills">Skills list</CvDetailsFrame>);
  expect(within(sections).getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "page");
  expect(within(sections).getByRole("link", { name: "Details" })).toHaveAttribute("href", "/cvs/7" + suffix);
  const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
  expect(within(breadcrumb).getByRole("link", { name: "CVs" })).toHaveAttribute("href", "/cvs" + suffix);
  expect(within(breadcrumb).getByText("Frontend CV")).toBeVisible();
});

it("groups CV skills in category order and announces text mastery levels", () => {
  const { rerender } = render(skillsView());
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings.map((element) => element.textContent)).toEqual(["Frontend", "Databases", "Uncategorized"]);
  expect(within(screen.getByRole("region", { name: "Frontend" })).getByRole("button", { name: "React Expert" })).toBeVisible();
  expect(screen.queryByText("Vue")).not.toBeInTheDocument();

  rerender(skillsView([]));
  expect(screen.getByText("No skills added yet")).toBeVisible();
  expect(screen.getByRole("button", { name: "Remove skills" })).toBeDisabled();
});

it("adds an unused profile skill with inherited mastery and retains the choice after failure", async () => {
  vi.mocked(changeCvSkills).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("saved");
  const user = userEvent.setup();
  const { rerender } = render(skillsView());
  const trigger = screen.getByRole("button", { name: "Add skill" });
  await user.click(trigger);
  const dialog = within(screen.getByRole("dialog", { name: "Add skill" }));
  const select = dialog.getByRole("combobox", { name: "Skill" });
  expect(dialog.getAllByRole("option").map((item) => item.textContent)).toEqual(["Select skill", "Vue"]);
  expect(dialog.getByRole("button", { name: "Add" })).toBeDisabled();
  await user.click(select);
  await user.tab();
  expect(select).toHaveAccessibleDescription("Skill is required");

  await user.selectOptions(select, "Vue");
  await user.click(dialog.getByRole("button", { name: "Add" }));
  expect(changeCvSkills).toHaveBeenCalledWith("7", { action: "add", name: "Vue", mastery: "Advanced" });
  expect(await dialog.findByRole("alert")).toHaveTextContent("Failed to add skill");
  expect(select).toHaveValue("Vue");
  await user.click(dialog.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(skillsView([react, vue, postgres]));
  expect(screen.getByRole("button", { name: "Vue Elementary" })).toBeVisible();
});

it("edits only mastery, supports Escape, and restores focus to the skill", async () => {
  vi.mocked(changeCvSkills).mockResolvedValue("saved");
  const user = userEvent.setup();
  const { rerender } = render(skillsView());
  const trigger = screen.getByRole("button", { name: "React Expert" });
  trigger.focus();
  await user.keyboard("{Enter}");
  let dialog = within(screen.getByRole("dialog", { name: "Update skill" }));
  expect(dialog.getByRole("combobox", { name: "Skill" })).toBeDisabled();
  expect(dialog.getByRole("combobox", { name: "Skill" })).toHaveValue("React");
  expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(changeCvSkills).not.toHaveBeenCalled();

  await user.keyboard("{Enter}");
  dialog = within(screen.getByRole("dialog", { name: "Update skill" }));
  await user.selectOptions(dialog.getByRole("combobox", { name: "Skill Mastery" }), "Competent");
  await user.click(dialog.getByRole("button", { name: "Save" }));
  expect(changeCvSkills).toHaveBeenCalledWith("7", { action: "update", name: "React", mastery: "Competent" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(skillsView([{ ...react, mastery: "Competent" }]));
  expect(screen.getByRole("button", { name: "React Intermediate" })).toBeVisible();
});

it("confirms counted bulk removal, preserves selections on cancellation and exits after saving", async () => {
  vi.mocked(changeCvSkills).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("saved");
  const user = userEvent.setup();
  const { rerender } = render(skillsView());
  await user.click(screen.getByRole("button", { name: "Remove skills" }));
  expect(screen.getByRole("button", { name: "Remove (0)" })).toBeDisabled();
  const first = screen.getByRole("button", { name: "React Expert" });
  await user.click(first);
  await user.click(screen.getByRole("button", { name: "PostgreSQL Advanced" }));
  expect(first).toHaveAttribute("aria-pressed", "true");
  const remove = screen.getByRole("button", { name: "Remove (2)" });
  await user.click(remove);
  let dialog = within(screen.getByRole("dialog", { name: "Remove skills" }));
  expect(dialog.getByText("Are you sure you want to remove 2 skills?")).toBeVisible();
  await user.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(changeCvSkills).not.toHaveBeenCalled();
  expect(first).toHaveAttribute("aria-pressed", "true");

  await user.click(remove);
  dialog = within(screen.getByRole("dialog", { name: "Remove skills" }));
  await user.click(dialog.getByRole("button", { name: "Confirm" }));
  expect(changeCvSkills).toHaveBeenCalledWith("7", { action: "remove", name: ["React", "PostgreSQL"] });
  expect(await dialog.findByRole("alert")).toHaveTextContent("Failed to remove skills");
  await user.click(dialog.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  rerender(skillsView([git]));
  expect(screen.getByRole("button", { name: "Remove skills" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "React Expert" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Git Beginner" })).not.toHaveAttribute("aria-pressed");
});

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { addQualification } from "./add-qualification-action";
import { EmployeeLanguages, EmployeeSkills } from "./employee-qualifications";

vi.mock("./add-qualification-action", () => ({ addQualification: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

it("validates both required skill fields, filters assigned entries and sends catalog category and mastery", async () => {
  vi.mocked(addQualification).mockResolvedValue("added");
  const user = userEvent.setup();
  const skills: Parameters<typeof EmployeeSkills>[0] = {
    userId: "17",
    name: "Ada Lovelace",
    categories: [{ id: "3", name: "Frontend", order: 1 }],
    skills: [{ name: "CSS", categoryId: "3", mastery: "Novice" }],
    catalog: [{ id: "4", name: "CSS", category: { id: "3" } }, { id: "5", name: "React", category: { id: "3" } }],
  };
  const view = render(<EmployeeSkills {...skills} />);
  await user.click(screen.getByRole("button", { name: "Add skill" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Add skill" }));
  const skill = dialog.getByRole("combobox", { name: "Skill" });
  const mastery = dialog.getByRole("combobox", { name: "Skill Mastery" });
  const submit = dialog.getByRole("button", { name: "Add" });
  expect(submit).toBeDisabled();
  expect(dialog.queryByRole("option", { name: "CSS" })).not.toBeInTheDocument();
  await user.click(skill);
  await user.click(mastery);
  await user.click(dialog.getByRole("heading"));
  expect(skill).toHaveAccessibleDescription("Skill is required");
  expect(mastery).toHaveAccessibleDescription("Skill mastery is required");
  await user.selectOptions(skill, "5");
  expect(submit).toBeDisabled();
  await user.selectOptions(mastery, dialog.getByRole("option", { name: "Advanced" }));
  await user.click(submit);
  expect(addQualification).toHaveBeenCalledWith("17", { kind: "skill", name: "React", categoryId: "3", level: "Proficient" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  view.rerender(<EmployeeSkills {...skills} skills={[...skills.skills, { name: "React", categoryId: "3", mastery: "Proficient" }]} />);
  expect(within(screen.getByRole("region", { name: "Frontend" })).getByText("React").closest("li")).toHaveTextContent("Advanced");
});

it("keeps the language and proficiency when the request fails, then closes after retry", async () => {
  vi.mocked(addQualification).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("added");
  const user = userEvent.setup();
  render(<EmployeeLanguages name="Ada" userId="17" languages={[]} catalog={[{ id: "6", name: "French" }]} />);
  await user.click(screen.getByRole("button", { name: "Add language" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Add language" }));
  const language = dialog.getByRole("combobox", { name: "Language" });
  const proficiency = dialog.getByRole("combobox", { name: "Language Proficiency" });
  await user.selectOptions(language, "6");
  await user.selectOptions(proficiency, "B2");
  const submit = dialog.getByRole("button", { name: "Add" });
  await user.click(submit);
  expect(await dialog.findByRole("alert")).toHaveTextContent("Failed to add language");
  expect(language).toHaveValue("6");
  expect(proficiency).toHaveValue("B2");
  await user.click(submit);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(addQualification).toHaveBeenLastCalledWith("17", { kind: "language", name: "French", level: "B2" });
});

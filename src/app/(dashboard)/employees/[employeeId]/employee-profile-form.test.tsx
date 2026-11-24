import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { saveEmployeeProfile } from "./employee-profile-actions";
import { EmployeeProfileForm } from "./employee-profile-form";
import type { EmployeeProfile } from "./employee-profile-data";

vi.mock("./employee-profile-actions", () => ({ saveEmployeeProfile: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); });

const options = {
  departments: [{ id: "3", name: "Frontend" }, { id: "5", name: "Design" }],
  positions: [{ id: "4", name: "Developer" }],
};
const employee: EmployeeProfile = {
  id: "17", email: "ada@example.test", created_at: "1705190400000",
  profile: { first_name: "Ada", last_name: "Lovelace", avatar: null },
  department: options.departments[0], position: options.positions[0],
};

it("saves the four values and disables Update once the new values have been saved", async () => {
  vi.mocked(saveEmployeeProfile).mockResolvedValue("updated");
  render(<EmployeeProfileForm employee={employee} options={options} />);
  const user = userEvent.setup();
  const update = screen.getByRole("button", { name: "Update" });
  expect(update).toBeDisabled();
  await user.selectOptions(screen.getByRole("combobox", { name: "Department" }), "5");
  await waitFor(() => expect(update).toBeEnabled());
  await user.click(update);
  expect(await screen.findByRole("status")).toHaveTextContent("Profile updated");
  expect(update).toBeDisabled();
  expect(saveEmployeeProfile).toHaveBeenCalledWith("17", {
    first_name: "Ada", last_name: "Lovelace", departmentId: "5", positionId: "4",
  });
});

it("displays validation inline and retains edits when saving fails", async () => {
  vi.mocked(saveEmployeeProfile).mockResolvedValue("unavailable");
  render(<EmployeeProfileForm employee={employee} options={options} />);
  const firstName = screen.getByRole("textbox", { name: "First Name" });
  const update = screen.getByRole("button", { name: "Update" });
  fireEvent.change(firstName, { target: { value: " " } });
  await waitFor(() => expect(firstName).toHaveAccessibleDescription("First name is required"));
  expect(update).toBeDisabled();
  fireEvent.change(firstName, { target: { value: "Grace" } });
  await waitFor(() => expect(update).toBeEnabled());
  await userEvent.click(update);
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to update profile");
  expect(firstName).toHaveValue("Grace");
});

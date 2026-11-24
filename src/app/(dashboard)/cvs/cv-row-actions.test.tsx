import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { EditableCvForm } from "./cv-form";
import { CvRowActions } from "./cv-row-actions";
import { deleteEmployeeCv, updateEmployeeCv } from "./manage-cv-actions";

vi.mock("./manage-cv-actions", () => ({
  deleteEmployeeCv: vi.fn(),
  updateEmployeeCv: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

const cv = {
  id: "17", name: "Software Engineer", education: "Computer Science",
  description: "First paragraph\n\n" + "Full description. ".repeat(40).trimEnd(),
  user: { email: "ada@example.test" },
};
const href = "/cvs/17?search=Engineer&page=2";

it("opens the row menu by keyboard, links to Details and closes on Escape", async () => {
  const user = userEvent.setup();
  render(<CvRowActions cv={cv} href={href} />);
  const trigger = screen.getByRole("button", { name: "Actions for Software Engineer" });
  await user.tab();
  expect(trigger).toHaveFocus();
  await user.keyboard("{Enter}");
  const menu = within(await screen.findByRole("menu"));
  expect(menu.getByRole("menuitem", { name: "View" })).toHaveAttribute("href", href);
  expect(menu.getByRole("menuitem", { name: "Edit" })).toBeVisible();
  expect(menu.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});

it("prepopulates the Edit dialog and saves the selected CV", async () => {
  vi.mocked(updateEmployeeCv).mockResolvedValue("updated");
  const user = userEvent.setup();
  render(<CvRowActions cv={cv} href={href} />);
  await user.click(screen.getByRole("button", { name: /Actions for/ }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Update CV" }));
  expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue(cv.name);
  expect(dialog.getByRole("textbox", { name: "Description" })).toHaveValue(cv.description);
  fireEvent.change(dialog.getByRole("textbox", { name: "Education" }), { target: { value: "Mathematics" } });
  await user.click(dialog.getByRole("button", { name: "Save" }));
  expect(updateEmployeeCv).toHaveBeenCalledWith("17", {
    name: cv.name, education: "Mathematics", description: cv.description,
  });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("only deletes after confirmation and keeps the dialog open on failure", async () => {
  vi.mocked(deleteEmployeeCv).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("deleted");
  const user = userEvent.setup();
  render(<CvRowActions cv={cv} href={href} />);
  screen.getByRole("button", { name: /Actions for/ }).focus();
  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  let dialog = within(await screen.findByRole("dialog", { name: "Delete CV" }));
  expect(dialog.getByText("Are you sure you want to delete CV Software Engineer?")).toBeVisible();
  await user.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(deleteEmployeeCv).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  screen.getByRole("button", { name: /Actions for/ }).focus();
  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  dialog = within(await screen.findByRole("dialog", { name: "Delete CV" }));
  const confirm = dialog.getByRole("button", { name: "Confirm" });
  await user.click(confirm);
  expect(await dialog.findByRole("alert")).toHaveTextContent("Failed to delete CV");
  await user.click(confirm);
  expect(deleteEmployeeCv).toHaveBeenLastCalledWith(cv.id);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("shows the complete description in Details and only enables Update for valid changes", async () => {
  vi.mocked(updateEmployeeCv).mockResolvedValue("updated");
  const user = userEvent.setup();
  render(<EditableCvForm cv={cv} action="Update" />);
  const update = screen.getByRole("button", { name: "Update" });
  const description = screen.getByRole("textbox", { name: "Description" });
  expect(update).toBeDisabled();
  expect(description).toHaveValue(cv.description);
  fireEvent.change(description, { target: { value: "" } });
  expect(await screen.findByText("Description is required")).toBeInTheDocument();
  expect(update).toBeDisabled();
  fireEvent.change(description, { target: { value: "A new description" } });
  await waitFor(() => expect(update).toBeEnabled());
  await user.click(update);
  expect(await screen.findByRole("status")).toHaveTextContent("CV updated");
  expect(update).toBeDisabled();
  expect(description).toHaveValue("A new description");
});

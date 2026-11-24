import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { createEmployeeCv } from "./create-cv-action";
import { CreateCvDialog } from "./create-cv-dialog";

vi.mock("./create-cv-action", () => ({ createEmployeeCv: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); });

async function openDialog(user = userEvent.setup()) {
  await user.click(screen.getByRole("button", { name: "Create CV" }));
  return screen.findByRole("dialog", { name: "Create CV" });
}

it("keeps Create disabled and links inline errors to the fields", async () => {
  render(<CreateCvDialog />);
  const dialog = await openDialog();
  const name = within(dialog).getByRole("textbox", { name: "Name" });
  const education = within(dialog).getByRole("textbox", { name: "Education" });
  const description = within(dialog).getByRole("textbox", { name: "Description" });
  const submit = within(dialog).getByRole("button", { name: "Create" });

  expect(submit).toBeDisabled();
  fireEvent.change(name, { target: { value: " " } });
  fireEvent.change(education, { target: { value: "x".repeat(256) } });
  fireEvent.change(description, { target: { value: " " } });

  await waitFor(() => expect(name).toHaveAccessibleDescription("Name is required"));
  expect(education).toHaveAccessibleDescription("Education must be at most 255 characters");
  expect(description).toHaveAccessibleDescription("Description is required");
  expect(submit).toBeDisabled();
  expect(createEmployeeCv).not.toHaveBeenCalled();
});

it("keeps the draft after a server error and closes the dialog after a successful retry", async () => {
  vi.mocked(createEmployeeCv).mockResolvedValueOnce("unavailable").mockResolvedValueOnce("created");
  const user = userEvent.setup();
  render(<CreateCvDialog />);
  const dialog = await openDialog(user);
  const name = within(dialog).getByRole("textbox", { name: "Name" });
  const education = within(dialog).getByRole("textbox", { name: "Education" });
  const description = within(dialog).getByRole("textbox", { name: "Description" });
  const submit = within(dialog).getByRole("button", { name: "Create" });

  await user.type(name, " Engineer ");
  await user.type(education, "University");
  await user.type(description, "Portfolio description");
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);

  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to create CV");
  expect(name).toHaveValue(" Engineer ");
  expect(education).toHaveValue("University");
  expect(description).toHaveValue("Portfolio description");

  await user.click(submit);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveTextContent("CV created");
  expect(createEmployeeCv).toHaveBeenLastCalledWith({
    name: "Engineer", education: "University", description: "Portfolio description",
  });
});

it("discards canceled drafts and supports closing with Escape", async () => {
  const user = userEvent.setup();
  render(<CreateCvDialog />);
  const firstDialog = await openDialog(user);
  await user.type(within(firstDialog).getByRole("textbox", { name: "Name" }), "Canceled name");
  await user.click(within(firstDialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  const secondDialog = await openDialog(user);
  expect(within(secondDialog).getByRole("textbox", { name: "Name" })).toHaveValue("");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(createEmployeeCv).not.toHaveBeenCalled();
});

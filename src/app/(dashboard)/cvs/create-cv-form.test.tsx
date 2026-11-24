import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { createEmployeeCv } from "./create-cv-action";
import { CreateCvForm } from "./create-cv-form";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("./create-cv-action", () => ({ createEmployeeCv: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); });

const query = { search: "Engineer", page: 2, sortOrder: "DESC" } as const;
const queryString = "?search=Engineer&page=2&sort_by=name&sort_order=DESC";

it("keeps Create disabled and links inline errors to the fields", async () => {
  render(<CreateCvForm query={query} />);
  const name = screen.getByRole("textbox", { name: "Name" });
  const education = screen.getByRole("textbox", { name: "Education" });
  const description = screen.getByRole("textbox", { name: "Description" });
  const submit = screen.getByRole("button", { name: "Create" });

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

it("keeps the draft after a server error and opens the new CV Details after retry", async () => {
  vi.mocked(createEmployeeCv).mockResolvedValueOnce("unavailable").mockResolvedValueOnce({ id: "17" });
  const user = userEvent.setup();
  render(<CreateCvForm query={query} />);
  const name = screen.getByRole("textbox", { name: "Name" });
  const education = screen.getByRole("textbox", { name: "Education" });
  const description = screen.getByRole("textbox", { name: "Description" });
  const submit = screen.getByRole("button", { name: "Create" });

  await user.type(name, " Engineer ");
  await user.type(education, "University");
  await user.type(description, "Portfolio description");
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);

  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to create CV");
  expect(name).toHaveValue(" Engineer ");
  expect(education).toHaveValue("University");
  expect(description).toHaveValue("Portfolio description");

  await user.click(submit);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/cvs/17" + queryString));
  await waitFor(() => expect(submit).toBeDisabled());
  expect(name).toHaveValue("");
  expect(createEmployeeCv).toHaveBeenLastCalledWith({
    name: "Engineer", education: "University", description: "Portfolio description",
  });
});

it("renders a standalone blank form with Cancel linking to the filtered list", () => {
  render(<CreateCvForm query={query} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
  expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/cvs" + queryString);
  expect(createEmployeeCv).not.toHaveBeenCalled();
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { verifyEmail } from "./actions";
import { VerificationForm } from "./verification-form";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("./actions", () => ({ verifyEmail: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

function pasteCode(value: string) {
  fireEvent.paste(screen.getByRole("textbox", { name: "Digit 1 of 6" }), {
    clipboardData: { getData: () => value },
  });
}

it("moves to the next input and accepts a pasted code with a leading zero", async () => {
  render(<VerificationForm />);
  const user = userEvent.setup();
  const fields = screen.getAllByRole("textbox");
  await user.type(fields[0], "7");
  expect(fields[1]).toHaveFocus();

  vi.mocked(verifyEmail).mockResolvedValue("success");
  pasteCode("012345");
  expect(fields.map((field) => (field as HTMLInputElement).value)).toEqual(["0", "1", "2", "3", "4", "5"]);
  await user.click(screen.getByRole("button", { name: "CONFIRM" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/employees"));
  expect(verifyEmail).toHaveBeenCalledExactlyOnceWith("012345");
});

it("keeps the entered digits when the code is rejected or expired", async () => {
  render(<VerificationForm />);
  const user = userEvent.setup();
  vi.mocked(verifyEmail).mockResolvedValueOnce("invalid").mockResolvedValueOnce("expired");
  pasteCode("012345");
  const confirm = screen.getByRole("button", { name: "CONFIRM" });

  await user.click(confirm);
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid verification code.");
  expect(screen.getByRole("textbox", { name: "Digit 1 of 6" })).toHaveValue("0");

  await user.click(confirm);
  expect(await screen.findByRole("alert")).toHaveTextContent("Verification code has expired.");
  expect(screen.getByRole("textbox", { name: "Digit 6 of 6" })).toHaveValue("5");
});

it("offers a Later link without submitting verification", () => {
  render(<VerificationForm />);
  expect(screen.getByRole("link", { name: "LATER" })).toHaveAttribute("href", "/employees");
  expect(verifyEmail).not.toHaveBeenCalled();
});

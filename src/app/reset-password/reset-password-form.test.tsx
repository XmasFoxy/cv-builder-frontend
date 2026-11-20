import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { resetPassword } from "./actions";
import { ResetPasswordForm } from "./reset-password-form";

const { getToken, replace } = vi.hoisted(() => ({ getToken: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: getToken }),
  useRouter: () => ({ replace }),
}));
vi.mock("./actions", () => ({ resetPassword: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

function renderForm(token: string | null = "test.header.signature") {
  getToken.mockReturnValue(token);
  render(<ResetPasswordForm />);
}

async function submit(confirmation = "new-password") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("New password"), "new-password");
  await user.type(screen.getByLabelText("Confirm password"), confirmation);
  await user.click(screen.getByRole("button", { name: "SUBMIT" }));
}

it("offers a new link when there is no token", () => {
  renderForm(null);
  expect(screen.getByRole("link", { name: "REQUEST A NEW LINK" })).toHaveAttribute(
    "href", "/forgot-password",
  );
  expect(screen.queryByRole("button", { name: "SUBMIT" })).not.toBeInTheDocument();
});

it("validates password confirmation", async () => {
  renderForm();
  await submit("different-password");
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
});

it("shows an open eye for hidden passwords and a crossed eye for visible passwords", async () => {
  renderForm();
  const user = userEvent.setup();
  const password = screen.getByLabelText("New password");
  const confirmation = screen.getByLabelText("Confirm password");
  const toggle = screen.getByRole("button", { name: "Show new password" });

  expect(password).toHaveAttribute("autocomplete", "off");
  expect(confirmation).toHaveAttribute("autocomplete", "off");
  expect(password).toHaveAttribute("type", "password");
  expect(toggle.querySelector(".lucide-eye")).toBeInTheDocument();

  await user.click(toggle);
  expect(password).toHaveAttribute("type", "text");
  expect(confirmation).toHaveAttribute("type", "password");
  expect(toggle.querySelector(".lucide-eye-off")).toBeInTheDocument();

  await user.click(toggle);
  expect(password).toHaveAttribute("type", "password");
  expect(toggle.querySelector(".lucide-eye")).toBeInTheDocument();
});

it("offers a new link when the backend rejects an expired token", async () => {
  vi.mocked(resetPassword).mockResolvedValue("expired");
  renderForm();
  await submit();
  expect(await screen.findByText(/link has expired/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "REQUEST A NEW LINK" })).toHaveAttribute(
    "href", "/forgot-password",
  );
});

it("opens the dashboard when reset also creates a session", async () => {
  vi.mocked(resetPassword).mockResolvedValue("signed-in");
  renderForm();
  await submit();
  expect(replace).toHaveBeenCalledExactlyOnceWith("/employees");
});

it("links back to sign in when the password changed but a session could not be created", async () => {
  vi.mocked(resetPassword).mockResolvedValue("updated");
  renderForm();
  await submit();
  expect(await screen.findByText(/password has been updated/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "GO TO SIGN IN" })).toHaveAttribute("href", "/login");
});

import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { expect, it, vi } from "vitest";

import { RESET_PASSWORD_MUTATION } from "@/graphql/auth";
import { ResetPasswordForm } from "./reset-password-form";

const { getToken } = vi.hoisted(() => ({ getToken: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => ({ get: getToken }) }));

const request = {
  query: RESET_PASSWORD_MUTATION,
  variables: { auth: { newPassword: "new-password", confirmPassword: "new-password" } },
};

function renderForm(
  mocks: React.ComponentProps<typeof MockedProvider>["mocks"] = [],
  token: string | null = "test.header.signature",
) {
  getToken.mockReturnValue(token);
  render(<MockedProvider mocks={mocks}><ResetPasswordForm /></MockedProvider>);
}

async function submit(confirmation = "new-password") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("New password"), "new-password");
  await user.type(screen.getByLabelText("Confirm password"), confirmation);
  await user.click(screen.getByRole("button", { name: "SUBMIT" }));
}

it("offers a new link when there is no token", () => {
  renderForm([], null);
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
  renderForm([{ request, result: { errors: [new GraphQLError("actionExpired")] } }]);
  await submit();
  expect(await screen.findByText(/link has expired/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "REQUEST A NEW LINK" })).toHaveAttribute(
    "href", "/forgot-password",
  );
});

it("confirms the reset when GraphQL returns null and links back to sign in", async () => {
  renderForm([{ request, result: { data: { resetPassword: null } } }]);
  await submit();
  expect(await screen.findByText(/password has been updated/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "GO TO SIGN IN" })).toHaveAttribute("href", "/login");
});

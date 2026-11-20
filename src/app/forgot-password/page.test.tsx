import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { expect, it } from "vitest";

import { FORGOT_PASSWORD_MUTATION } from "@/graphql/auth";
import ForgotPasswordPage from "./page";

const email = "test@example.com";
const request = { query: FORGOT_PASSWORD_MUTATION, variables: { auth: { email } } };
const confirmation = "If an account exists for this email, you’ll receive password reset instructions.";

function renderPage(mocks: React.ComponentProps<typeof MockedProvider>["mocks"] = []) {
  render(<MockedProvider mocks={mocks}><ForgotPasswordPage /></MockedProvider>);
}

async function submit(value: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: "Email" }), value);
  await user.click(screen.getByRole("button", { name: "RESET PASSWORD" }));
}

it("shows validation and provides a way back to sign in", async () => {
  renderPage();
  await submit("invalid");

  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address");
  expect(screen.getByRole("link", { name: "CANCEL" })).toHaveAttribute("href", "/login");
});

it("shows confirmation when GraphQL returns a null result", async () => {
  renderPage([{ request, result: { data: { forgotPassword: null } } }]);
  await submit(email);

  expect(await screen.findByRole("status")).toHaveTextContent(confirmation);
});

it("shows the same confirmation when delivery is undisclosed", async () => {
  renderPage([{ request, result: { errors: [new GraphQLError("failedToSendEmail")] } }]);
  await submit(email);

  expect(await screen.findByRole("status")).toHaveTextContent(confirmation);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("preserves the email when a request fails", async () => {
  renderPage([{ request, error: new Error("Connection unavailable") }]);
  await submit(email);

  expect(await screen.findByRole("alert")).toHaveTextContent("Please try again later.");
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(email);
});

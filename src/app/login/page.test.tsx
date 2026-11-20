import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { signIn } from "./actions";
import LoginPage from "./page";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("./actions", () => ({ signIn: vi.fn() }));

const credentials = {
  email: "test@example.com",
  password: "test-password",
};

async function submitLogin(email = credentials.email) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: "Email" }), email);
  await user.type(screen.getByLabelText("Password"), credentials.password);
  await user.click(screen.getByRole("button", { name: "SIGN IN" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    render(<LoginPage />);
  });

  it("renders the login form", () => {
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SIGN IN" })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "SIGN IN" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("does not submit an invalid email", async () => {
    await submitLogin("hello");

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows an error when credentials are invalid", async () => {
    vi.mocked(signIn).mockResolvedValue("invalid-credentials");
    await submitLogin();

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens employees after creating a session", async () => {
    vi.mocked(signIn).mockResolvedValue("success");
    await submitLogin();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/employees"));
    expect(signIn).toHaveBeenCalledExactlyOnceWith(credentials);
  });
});

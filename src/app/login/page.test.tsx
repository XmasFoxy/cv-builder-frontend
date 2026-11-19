
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import { GraphQLError } from "graphql";

import LoginPage from "./page";
import { LOGIN_MUTATION } from "@/graphql/auth";

const loginVariables = {
  auth: {
    email: "test@example.com",
    password: "wrong-password",
  },
};

function renderLogin(
  mocks: React.ComponentProps<typeof MockedProvider>["mocks"] = [],
) {
  return render(
    <MockedProvider mocks={mocks}>
      <LoginPage />
    </MockedProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "Email" }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "SIGN IN" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.click(
      screen.getByRole("button", { name: "SIGN IN" }),
    );

    expect(
      await screen.findByText("Email is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Password is required"),
    ).toBeInTheDocument();
  });

  it("does not send login mutation for invalid email", async () => {
    const user = userEvent.setup();
    const mutationSpy = vi.fn();

    renderLogin([
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            auth: {
              email: "hello",
              password: "123456",
            },
          },
        },
        result: () => {
          mutationSpy();

          return {
            data: {
              login: {
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                user: {
                  id: "1",
                  email: "hello",
                },
              },
            },
          };
        },
      },
    ]);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "hello",
    );

    await user.type(
      screen.getByLabelText("Password"),
      "123456",
    );

    await user.click(
      screen.getByRole("button", { name: "SIGN IN" }),
    );

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();

    expect(mutationSpy).not.toHaveBeenCalled();
  });

  it("shows an error when credentials are invalid", async () => {
    const user = userEvent.setup();

    renderLogin([
      {
        request: {
          query: LOGIN_MUTATION,
          variables: loginVariables,
        },
        result: {
          errors: [
            new GraphQLError("invalidCredentials"),
          ],
        },
      },
    ]);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      loginVariables.auth.email,
    );

    await user.type(
      screen.getByLabelText("Password"),
      loginVariables.auth.password,
    );

    await user.click(
      screen.getByRole("button", { name: "SIGN IN" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password"),
      ).toBeInTheDocument();
    });
  });

  it("executes login mutation successfully", async () => {
    const user = userEvent.setup();

    const mutationSpy = vi.fn(() => ({
      data: {
        login: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          user: {
            id: "1",
            email: "test@example.com",
          },
        },
      },
    }));

    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});

    try {
      renderLogin([
        {
          request: {
            query: LOGIN_MUTATION,
            variables: {
              auth: {
                email: "test@example.com",
                password: "correct-password",
              },
            },
          },
          result: mutationSpy,
        },
      ]);

      await user.type(
        screen.getByRole("textbox", { name: "Email" }),
        "test@example.com",
      );

      await user.type(
        screen.getByLabelText("Password"),
        "correct-password",
      );

      await user.click(
        screen.getByRole("button", { name: "SIGN IN" }),
      );

      await waitFor(() => {
        expect(mutationSpy).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Login successful:",
          {
            id: "1",
            email: "test@example.com",
          },
        );
      });

      expect(
        screen.queryByText("Invalid email or password"),
      ).not.toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

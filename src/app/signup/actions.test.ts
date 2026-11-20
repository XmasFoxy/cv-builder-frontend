// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";
import { registerAccount } from "./actions";

const { set } = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set }),
  headers: async () => new Headers({ origin: "http://localhost:3000" }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("sends the app origin and creates a session before verification", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({
    data: {
      signup: {
        access_token: "mock-access",
        refresh_token: "mock-refresh",
        user: { id: "1", email: "test@example.com" },
      },
    },
  }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(registerAccount({
    email: "test@example.com",
    password: "example-password",
    confirmPassword: "example-password",
  })).resolves.toBe("success");
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("origin")).toBe("http://localhost:3000");
  expect(set.mock.calls.map(([name]) => name)).toEqual(["cv_access_token", "cv_refresh_token"]);
});

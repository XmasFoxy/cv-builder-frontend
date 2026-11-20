// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";

import { signIn } from "../login/actions";
import { resetPassword } from "./actions";

vi.mock("../login/actions", () => ({ signIn: vi.fn() }));

const email = "test@example.com";
const token = `header.${Buffer.from(JSON.stringify({ email, jti: "test-link" })).toString("base64url")}.signature`;
const input = { newPassword: "example-password", confirmPassword: "example-password" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it("signs in with the new password only after GraphQL confirms the reset", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({
    data: { resetPassword: null },
  }));
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(signIn).mockResolvedValue("success");

  await expect(resetPassword(token, input)).resolves.toBe("signed-in");
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization")).toBe(`Bearer ${token}`);
  expect(signIn).toHaveBeenCalledExactlyOnceWith({ email, password: input.newPassword });
});

it("does not sign in if GraphQL rejects the link", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({
    errors: [{ message: "actionExpired" }],
  })));

  await expect(resetPassword(token, input)).resolves.toBe("expired");
  expect(signIn).not.toHaveBeenCalled();
});

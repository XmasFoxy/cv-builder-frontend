// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signIn } from "./actions";

const { setCookie } = vi.hoisted(() => ({ setCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie }) }));

const fetchMock = vi.fn<typeof fetch>();
const credentials = { email: "test@example.com", password: "test-password" };

function mockBackendResponse(body: object) {
  fetchMock.mockResolvedValueOnce(Response.json(body));
}

describe("signIn", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("calls login and stores both tokens in HttpOnly cookies", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockBackendResponse({
      data: {
        login: {
          user: { id: "1", email: credentials.email },
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
        },
      },
    });

    await expect(signIn(credentials)).resolves.toBe("success");

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody).toMatchObject({
      operationName: "Login",
      variables: { auth: credentials },
    });

    const options = { httpOnly: true, secure: true, sameSite: "lax", path: "/" };
    expect(setCookie).toHaveBeenCalledTimes(2);
    expect(setCookie).toHaveBeenCalledWith("cv_access_token", "mock-access-token", {
      ...options,
      maxAge: 600,
    });
    expect(setCookie).toHaveBeenCalledWith("cv_refresh_token", "mock-refresh-token", {
      ...options,
      maxAge: 604800,
    });
  });

  it("rejects invalid input before calling the backend", async () => {
    await expect(signIn({ ...credentials, email: "hello" })).resolves.toBe("invalid-credentials");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("does not create a session when the backend rejects the credentials", async () => {
    mockBackendResponse({ errors: [{ message: "invalidCredentials" }] });

    await expect(signIn(credentials)).resolves.toBe("invalid-credentials");
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("does not create a session with a missing token", async () => {
    mockBackendResponse({
      data: {
        login: {
          user: { id: "1", email: credentials.email },
          access_token: "mock-access-token",
          refresh_token: "",
        },
      },
    });

    await expect(signIn(credentials)).resolves.toBe("unavailable");
    expect(setCookie).not.toHaveBeenCalled();
  });
});

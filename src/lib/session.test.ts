// @vitest-environment node

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/refresh/route";
import { requireSession } from "./session";
import { accessCookie, refreshCookie } from "./session-cookies";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(path); },
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("sends visitors without a session to sign in", async () => {
  await expect(requireSession("/cvs")).rejects.toThrow("/login");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("tries the refresh endpoint when access is rejected", async () => {
  store.get.mockReturnValue({ value: "test-token" });
  fetchMock.mockResolvedValueOnce(Response.json({ errors: [{ message: "unauthorized" }] }));

  await expect(requireSession("/skills")).rejects.toThrow("/api/auth/refresh?next=%2Fskills");
});

it("stores both refreshed tokens and redirects within the dashboard", async () => {
  store.get.mockReturnValue({ value: "old-refresh-token" });
  fetchMock
    .mockResolvedValueOnce(Response.json({
      data: { updateToken: { access_token: "new-access", refresh_token: "new-refresh" } },
    }))
    .mockResolvedValueOnce(Response.json({ data: { languages: { __typename: "PaginatedLanguages" } } }));

  const result = await GET(new Request("http://localhost/api/auth/refresh?next=%2F%2Fexample.test"));

  expect(result.headers.get("location")).toBe("/employees");
  expect(store.set.mock.calls.map(([name, value]) => [name, value])).toEqual([
    [accessCookie, "new-access"],
    [refreshCookie, "new-refresh"],
  ]);
});

it("clears cookies when the backend rejects the refresh token", async () => {
  store.get.mockReturnValue({ value: "expired-refresh-token" });
  fetchMock.mockResolvedValueOnce(Response.json({
    errors: [{ message: "invalidRefreshToken" }],
  }));

  const result = await GET(new Request("http://localhost/api/auth/refresh"));

  expect(result.headers.get("location")).toBe("/login");
  expect(store.delete.mock.calls.flat()).toEqual([accessCookie, refreshCookie]);
});

it("keeps the session cookies during an upstream outage", async () => {
  store.get.mockReturnValue({ value: "valid-refresh-token" });
  fetchMock.mockRejectedValueOnce(new Error("network failure"));

  const result = await GET(new Request("http://localhost/api/auth/refresh"));

  expect(result.status).toBe(503);
  expect(store.delete).not.toHaveBeenCalled();
});

// @vitest-environment node

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { accessCookie, refreshCookie } from "@/lib/session-cookies";

import { getEmployeeProfile } from "./employee-profile-data";

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(path); },
}));

const fetchMock = vi.fn<typeof fetch>();
const query = { search: "ada+team", page: 2, sort: { sort_by: "last_name", sort_order: "DESC" } } as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  getCookie.mockImplementation((name) => name === accessCookie ? { value: "access" } : { value: "refresh" });
});

afterEach(() => vi.unstubAllGlobals());

it("loads the selected profile from GraphQL using a non-cacheable authenticated request", async () => {
  const user = { id: "17", email: "ada@example.test", created_at: "1705190400000" };
  fetchMock.mockResolvedValueOnce(Response.json({ data: { user } }));
  await expect(getEmployeeProfile("17", query)).resolves.toEqual({ status: "found", employee: user });
  const [, options] = fetchMock.mock.calls[0];

  expect(new Headers(options?.headers).get("authorization")).toBe("Bearer access");
  expect(options?.cache).toBe("no-store");
  const body = JSON.parse(String(options?.body));
  expect(body.operationName).toBe("EmployeeProfile");
  expect(body.variables).toEqual({ userId: "17" });
});

it("does not query GraphQL when there is no session", async () => {
  getCookie.mockReturnValue(undefined);
  await expect(getEmployeeProfile("17", query)).rejects.toThrow("/login");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("keeps the profile and list context when the access token must be refreshed", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ errors: [{ message: "unauthorized" }] }));
  const destination = "/employees/17?search=ada%2Bteam&page=2&sort_by=last_name&sort_order=DESC";
  await expect(getEmployeeProfile("17", query)).rejects.toThrow(
    `/api/auth/refresh?next=${encodeURIComponent(destination)}`,
  );
  expect(getCookie).toHaveBeenCalledWith(refreshCookie);
});

it("distinguishes a missing employee from a backend outage", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ errors: [{ message: "userNotFound" }] }))
    .mockRejectedValueOnce(new Error("Network failure"));
  await expect(getEmployeeProfile("17", query)).resolves.toEqual({ status: "missing" });
  await expect(getEmployeeProfile("17", query)).resolves.toEqual({ status: "unavailable" });
});

it("handles an invalid direct URL without querying the database", async () => {
  await expect(getEmployeeProfile("2147483648", query)).resolves.toEqual({ status: "missing" });
  expect(fetchMock).not.toHaveBeenCalled();
});

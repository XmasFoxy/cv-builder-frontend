// @vitest-environment node

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { accessCookie, refreshCookie } from "@/lib/session-cookies";

import { getCvs } from "./cvs-data";
import { readCvsQuery } from "./cvs-url";

const store = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("Not found"); },
  redirect: (path: string) => { throw new Error(path); },
}));
const fetchMock = vi.fn<typeof fetch>();
const query = readCvsQuery({ search: "Test CV", sort_by: "name", sort_order: "DESC", page: "2" });

function token(role: string) {
  return `header.${Buffer.from(JSON.stringify({ sub: "1", role })).toString("base64url")}.signature`;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("loads the session-scoped list without supplying an owner from the client", async () => {
  const value = token("Employee");
  const result = { items: [], total: 0, page: 2, limit: 10, total_pages: 0 };
  store.get.mockReturnValue({ value });
  fetchMock.mockResolvedValueOnce(Response.json({ data: { cvs: result } }));

  await expect(getCvs(query)).resolves.toEqual(result);
  const request = fetchMock.mock.calls[0][1];
  expect(new Headers(request?.headers).get("Authorization")).toBe(`Bearer ${value}`);
  expect(request?.cache).toBe("no-store");
  expect(JSON.parse(String(request?.body))).toMatchObject({
    operationName: "EmployeeCvs",
    query: expect.stringContaining("cvs(params: $params)"),
    variables: { params: { search: "Test CV", page: 2, limit: 10, sort_by: "name", sort_order: "DESC" } },
  });
});

it("redirects a visitor without a session before requesting data", async () => {
  await expect(getCvs(query)).rejects.toThrow("/login");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not request the API's admin-wide list for Admin sessions", async () => {
  store.get.mockReturnValue({ value: token("Admin") });
  await expect(getCvs(query)).rejects.toThrow("Not found");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("preserves the current query when the API rejects the access token and refresh is possible", async () => {
  store.get.mockImplementation((name) => ({
    value: name === accessCookie ? token("Employee") : name === refreshCookie ? "refresh" : undefined,
  }));
  fetchMock.mockResolvedValueOnce(Response.json({ errors: [{ message: "unauthorized" }] }));
  const destination = "/cvs?search=Test+CV&page=2&sort_by=name&sort_order=DESC";

  await expect(getCvs(query)).rejects.toThrow(`/api/auth/refresh?next=${encodeURIComponent(destination)}`);
});

it("returns the retryable error result when the API is unavailable", async () => {
  store.get.mockReturnValue({ value: token("Employee") });
  fetchMock.mockRejectedValueOnce(new Error("network failure"));
  await expect(getCvs(query)).resolves.toBeNull();
});

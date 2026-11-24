// @vitest-environment node

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { accessCookie, refreshCookie } from "@/lib/session-cookies";

import { createEmployeeCv } from "./create-cv-action";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("next/cache", () => ({ revalidatePath }));

const fetchMock = vi.fn<typeof fetch>();
const fields = { name: "Frontend Engineer", education: "Computer Science", description: "Builds web apps." };
const employeeToken = token("Employee", 31);

function token(role: string, sub: number) {
  return `header.${Buffer.from(JSON.stringify({ sub, role })).toString("base64url")}.signature`;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("creates the CV using only validated fields and the session owner, then refreshes the list", async () => {
  store.get.mockReturnValue({ value: employeeToken });
  fetchMock.mockResolvedValueOnce(Response.json({ data: { createCv: { id: "10" } } }));
  const supplied = { ...fields, name: " Frontend Engineer ", userId: "32" };

  await expect(createEmployeeCv(supplied)).resolves.toEqual({ id: "10" });

  const request = fetchMock.mock.calls[0][1];
  expect(new Headers(request?.headers).get("Authorization")).toBe(`Bearer ${employeeToken}`);
  expect(JSON.parse(String(request?.body))).toMatchObject({
    operationName: "CreateEmployeeCv",
    variables: { cv: { ...fields, userId: "31" } },
  });
  expect(revalidatePath).toHaveBeenCalledExactlyOnceWith("/cvs");
});

it.each([
  { name: " " },
  { education: "" },
  { education: "x".repeat(256) },
  { name: "x".repeat(256) },
  { description: "\n" },
])("rejects invalid form data before sending a mutation (%s)", async (invalid) => {
  await expect(createEmployeeCv({ ...fields, ...invalid })).resolves.toBe("invalid");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("blocks creation without a session or with an Admin session", async () => {
  await expect(createEmployeeCv(fields)).resolves.toBe("expired");

  store.get.mockReturnValue({ value: token("Admin", 32) });
  await expect(createEmployeeCv(fields)).resolves.toBe("forbidden");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("renews rejected access and submits once with the renewed session", async () => {
  const renewedToken = token("Employee", 31);
  store.get.mockImplementation((name) => ({
    value: name === accessCookie ? employeeToken : "old-refresh",
  }));
  fetchMock
    .mockResolvedValueOnce(Response.json({ errors: [{ message: "unauthorized" }] }))
    .mockResolvedValueOnce(Response.json({
      data: { updateToken: { access_token: renewedToken, refresh_token: "new-refresh" } },
    }))
    .mockResolvedValueOnce(Response.json({ data: { createCv: { id: "10" } } }));

  await expect(createEmployeeCv(fields)).resolves.toEqual({ id: "10" });
  expect(fetchMock.mock.calls.map(([, request]) => JSON.parse(String(request?.body)).operationName)).toEqual([
    "CreateEmployeeCv", "UpdateToken", "CreateEmployeeCv",
  ]);
  expect(store.set.mock.calls.map(([cookie, value]) => [cookie, value])).toEqual([
    [accessCookie, renewedToken], [refreshCookie, "new-refresh"],
  ]);
  expect(revalidatePath).toHaveBeenCalledExactlyOnceWith("/cvs");
});

it("reports an ambiguous network failure without automatically repeating the mutation", async () => {
  store.get.mockReturnValue({ value: employeeToken });
  fetchMock.mockRejectedValueOnce(new Error("connection lost"));

  await expect(createEmployeeCv(fields)).resolves.toBe("unavailable");
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(revalidatePath).not.toHaveBeenCalled();
});

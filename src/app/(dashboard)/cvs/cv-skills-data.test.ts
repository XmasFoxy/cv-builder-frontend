import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { beforeEach, expect, it, vi } from "vitest";

import { createApolloClient } from "@/lib/apollo-client";
import { readAccessToken, redirectForSession } from "@/lib/session";

import { getCvSkills } from "./cv-skills-data";

const apiQuery = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apollo-client", () => ({ createApolloClient: vi.fn() }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  readAccessToken: vi.fn(),
  redirectForSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

const filters = { search: "Engineer", page: 2, sortOrder: "ASC" } as const;
const destination = "/cvs/7/skills?search=Engineer&page=2";
const cvSkills = [{ name: "React", categoryId: "1", mastery: "Expert" }];
const ownerSkills = [...cvSkills, { name: "Vue", categoryId: "1", mastery: "Advanced" }];
const data = {
  cv: { id: "7", name: "Engineer", skills: cvSkills, user: { id: "4", profile: { skills: ownerSkills } } },
  me: { id: "4", role: "Employee" },
  skillCategories: [{ id: "1", name: "Frontend", order: 1 }],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(createApolloClient).mockReturnValue({ query: apiQuery } as unknown as ReturnType<typeof createApolloClient>);
  vi.mocked(readAccessToken).mockResolvedValue("employee-session");
});

it("loads the CV and its owner's distinct set of skills with the server session", async () => {
  apiQuery.mockResolvedValue({ data });
  await expect(getCvSkills("7", filters)).resolves.toEqual({
    id: "7", name: "Engineer", skills: cvSkills, ownerSkills, categories: data.skillCategories,
  });
  expect(readAccessToken).toHaveBeenCalledWith(destination);
  expect(apiQuery).toHaveBeenCalledWith(expect.objectContaining({
    variables: { id: "7" },
    fetchPolicy: "no-cache",
    context: expect.objectContaining({ headers: { authorization: "Bearer employee-session" } }),
  }));
});

it.each([{ id: "5", role: "Employee" }, { id: "4", role: "Admin" }])("rejects an unauthorized viewer even if the query returns data", async (me) => {
  apiQuery.mockResolvedValue({ data: { ...data, me } });
  await expect(getCvSkills("7", filters)).rejects.toThrow("notFound");
});

it("rejects malformed CV identifiers before using the session or the API", async () => {
  await expect(getCvSkills("2147483648", filters)).rejects.toThrow("notFound");
  expect(readAccessToken).not.toHaveBeenCalled();
  expect(apiQuery).not.toHaveBeenCalled();
});

it.each(["notOwnCv", "cvNotFound"])("handles %s as an unavailable route", async (message) => {
  apiQuery.mockRejectedValue(new CombinedGraphQLErrors({ errors: [{ message }] }));
  await expect(getCvSkills("7", filters)).rejects.toThrow("notFound");
});

it("resumes an expired session at Skills with the list filters intact", async () => {
  vi.mocked(redirectForSession).mockRejectedValue(new Error("refresh"));
  apiQuery.mockRejectedValue(new CombinedGraphQLErrors({ errors: [{ message: "unauthorized" }] }));
  await expect(getCvSkills("7", filters)).rejects.toThrow("refresh");
  expect(redirectForSession).toHaveBeenCalledWith(destination);
});

it("returns a retryable load result when the API is unavailable", async () => {
  apiQuery.mockRejectedValue(new Error("Connection closed"));
  await expect(getCvSkills("7", filters)).resolves.toBeNull();
});

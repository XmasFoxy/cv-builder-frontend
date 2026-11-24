import { render, screen, within } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server";
import type { ReactElement } from "react";
import { beforeEach, expect, it, vi } from "vitest";

import { EmployeeDetailsLoading } from "./employee-details-loading";
import { getEmployeeLanguages, getEmployeeSkills } from "./employee-profile-data";
import EmployeeLanguagesPage from "./languages/page";
import EmployeeSkillsPage from "./skills/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./employee-profile-data", () => ({
  getEmployeeLanguages: vi.fn(),
  getEmployeeSkills: vi.fn(),
}));

const identity = { email: "ada@example.test", profile: { first_name: "Ada", last_name: "Lovelace" } };
const searchParams = { search: "ada+team", sort_by: "last_name", sort_order: "DESC", page: "2" };
const props = { params: Promise.resolve({ employeeId: "17" }), searchParams: Promise.resolve(searchParams) };
const suffix = "?search=ada%2Bteam&page=2&sort_by=last_name&sort_order=DESC";

async function renderPage(page: ReactElement) {
  const stream = await renderToReadableStream(page);
  await stream.allReady;
  const html = await new Response(stream).text();
  const { container } = render(<div dangerouslySetInnerHTML={{ __html: html }} />);
  return within(container);
}

beforeEach(() => vi.resetAllMocks());

it("groups read-only skills by category, including skills whose category is missing", async () => {
  vi.mocked(getEmployeeSkills).mockResolvedValueOnce({
    status: "found",
    data: {
      user: {
        ...identity,
        profile: {
          ...identity.profile,
          skills: [
            { name: "React", categoryId: "1", mastery: "Proficient" },
            { name: "CSS", categoryId: "1", mastery: "Competent" },
            { name: "TypeScript", categoryId: "2", mastery: "Expert" },
            { name: "Git", categoryId: "removed", mastery: "Advanced" },
            { name: "Linux", categoryId: null, mastery: "Novice" },
          ],
        },
      },
      skillCategories: [
        { id: "1", name: "Frontend", order: 2 },
        { id: "2", name: "Programming languages", order: 1 },
        { id: "3", name: "Backend", order: 3 },
      ],
    },
  });

  const page = await renderPage(<EmployeeSkillsPage {...props} />);
  expect(getEmployeeSkills).toHaveBeenCalledWith("17", {
    search: "ada+team", page: 2, sort: { sort_by: "last_name", sort_order: "DESC" },
  });
  expect(getEmployeeLanguages).not.toHaveBeenCalled();
  expect(page.getByRole("heading", { name: "Skills for Ada Lovelace" })).toBeInTheDocument();
  expect(page.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
    "Programming languages", "Frontend", "Uncategorized",
  ]);
  const frontend = within(page.getByRole("region", { name: "Frontend" }));
  expect(frontend.getByText("React").closest("li")).toHaveTextContent("Proficient");
  expect(frontend.getByText("CSS").closest("li")).toHaveTextContent("Competent");
  const uncategorized = within(page.getByRole("region", { name: "Uncategorized" }));
  expect(uncategorized.getByText("Git").closest("li")).toHaveTextContent("Advanced");
  expect(uncategorized.getByText("Linux").closest("li")).toHaveTextContent("Novice");
  expect(page.queryByRole("button")).not.toBeInTheDocument();
  const nav = within(page.getByRole("navigation", { name: "Employee profile" }));
  expect(nav.getByRole("link", { name: "Skills", current: "page" })).toHaveAttribute("href", "/employees/17/skills" + suffix);
  expect(nav.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/employees/17" + suffix);
  expect(nav.getByRole("link", { name: "Languages" })).toHaveAttribute("href", "/employees/17/languages" + suffix);
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees" + suffix);
});

it("shows every language with its proficiency in a single read-only section", async () => {
  vi.mocked(getEmployeeLanguages).mockResolvedValueOnce({
    status: "found",
    data: {
      user: {
        ...identity,
        profile: {
          ...identity.profile,
          languages: [{ name: "English", proficiency: "Native" }, { name: "French", proficiency: "B2" }],
        },
      },
    },
  });

  const page = await renderPage(<EmployeeLanguagesPage {...props} />);
  const languages = within(page.getByRole("region", { name: "Current Languages" }));
  expect(languages.getByText("English").closest("li")).toHaveTextContent("Native");
  expect(languages.getByText("French").closest("li")).toHaveTextContent("B2");
  expect(page.queryByRole("button")).not.toBeInTheDocument();
  const nav = within(page.getByRole("navigation", { name: "Employee profile" }));
  expect(nav.getByRole("link", { name: "Languages", current: "page" })).toHaveAttribute("href", "/employees/17/languages" + suffix);
});

it("shows an empty state for a colleague without qualifications", async () => {
  vi.mocked(getEmployeeSkills).mockResolvedValueOnce({
    status: "found",
    data: {
      user: { ...identity, profile: { ...identity.profile, skills: [] } },
      skillCategories: [{ id: "1", name: "Frontend", order: 1 }],
    },
  });
  vi.mocked(getEmployeeLanguages).mockResolvedValueOnce({
    status: "found",
    data: { user: { ...identity, profile: { ...identity.profile, languages: [] } } },
  });

  const skills = await renderPage(<EmployeeSkillsPage {...props} />);
  expect(skills.getByText("No skills added yet")).toBeInTheDocument();
  expect(skills.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  const languages = await renderPage(<EmployeeLanguagesPage {...props} />);
  expect(languages.getByText("No languages added yet")).toBeInTheDocument();
  expect(within(languages.getByRole("region", { name: "Current Languages" })).queryByRole("list")).not.toBeInTheDocument();
});

it.each([
  { tab: "skills", Page: EmployeeSkillsPage, load: getEmployeeSkills },
  { tab: "languages", Page: EmployeeLanguagesPage, load: getEmployeeLanguages },
] as const)("announces loading and offers a retry when $tab fail to load", async ({ tab, Page, load }) => {
  render(<EmployeeDetailsLoading tab={tab} />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading " + tab + "…");

  vi.mocked(load).mockResolvedValueOnce({ status: "unavailable" });
  const page = await renderPage(<Page {...props} />);
  expect(page.getByRole("heading", { name: "Failed to load " + tab })).toBeInTheDocument();
  expect(page.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(page.getByRole("link", { name: "Employees" })).toHaveAttribute("href", "/employees" + suffix);
});

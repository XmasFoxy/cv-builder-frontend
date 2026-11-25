import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { CvPreviewContent, CvPreviewLoading } from "./cv-preview-content";
import { getCvPreview } from "./cv-preview-data";
import { buildCvPreview, type CvPreviewSource } from "./cv-preview-model";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("./cv-preview-data", () => ({ getCvPreview: vi.fn() }));

const categories = [
  { id: "1", name: "Frontend technologies", order: 1 },
  { id: "2", name: "Languages", order: 0 },
];
const source: CvPreviewSource = {
  name: "Application Engineer",
  education: "Computer Science",
  description: "Builds web applications.",
  user: {
    id: "3",
    position: { name: "Software Engineer" },
    profile: { full_name: "Ada Example", languages: [{ name: "English", proficiency: "C1" }] },
  },
  skills: [{ name: "React", categoryId: "1" }, { name: "Redux", categoryId: "1" }],
  projects: [{
    id: "5",
    project: { name: "Assigned project", domain: "Education", description: "Learning platform", environment: ["react", "Redux Toolkit"] },
    start_date: "2022-11-25",
    end_date: "2024-12-02",
    roles: ["Frontend Developer", "Team Lead"],
    responsibilities: ["Developed the UI"],
  }, {
    id: "6",
    project: { name: "Ongoing project", domain: " education ", description: "", environment: ["React"] },
    start_date: "2025-01-05",
    end_date: null,
    roles: [],
    responsibilities: [" "],
  }],
};
const today = new Date("2026-11-25T12:00:00Z");

async function renderPage() {
  return render(await CvPreviewContent({ cvId: "7", query: { search: "App", page: 2, sortOrder: "DESC" } }));
}

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("uses participation dates, exact technology names and the latest end across assigned projects", async () => {
  vi.mocked(getCvPreview).mockResolvedValue(buildCvPreview(source, categories, today));
  await renderPage();

  await screen.findByRole("heading", { name: "Ada Example" });
  expect(screen.getByText("Software Engineer")).toBeVisible();
  expect(screen.getByText("Computer Science")).toBeVisible();
  expect(screen.getByText("English — C1")).toBeVisible();
  expect(screen.getByText("Builds web applications.")).toBeVisible();
  expect(screen.getByText("Education", { selector: "p" })).toBeVisible();
  const project = screen.getByRole("region", { name: "Assigned project" });
  expect(within(project).getByText("11.2022 - 12.2024")).toBeVisible();
  expect(within(project).getByText("Frontend Developer, Team Lead")).toBeVisible();
  expect(within(project).getByText("Developed the UI")).toBeVisible();
  expect(within(project).getByText("react, Redux Toolkit")).toBeVisible();
  const ongoing = screen.getByRole("region", { name: "Ongoing project" });
  expect(within(ongoing).getByText("01.2025 - Present")).toBeVisible();
  expect(within(ongoing).queryByText("Project roles")).not.toBeInTheDocument();
  expect(within(ongoing).queryByText("Responsibilities")).not.toBeInTheDocument();

  const table = screen.getByRole("table", { name: "Professional skills" });
  expect(within(table).queryByRole("rowheader", { name: "Languages" })).not.toBeInTheDocument();
  expect(within(within(table).getByRole("row", { name: /React/ })).getAllByRole("cell")
    .map((cell) => cell.textContent)).toEqual(["React", "4", "2026"]);
  expect(within(within(table).getByRole("row", { name: /Redux/ })).getAllByRole("cell")
    .map((cell) => cell.textContent)).toEqual(["Redux", "", ""]);

  const filters = "?search=App&page=2&sort_by=name&sort_order=DESC";
  const tabs = within(screen.getByRole("navigation", { name: "CV sections" }));
  expect(tabs.getByRole("link", { name: "Preview" })).toHaveAttribute("aria-current", "page");
  expect(tabs.getByRole("link", { name: "Details" })).toHaveAttribute("href", `/cvs/7${filters}`);
  expect(tabs.getByRole("link", { name: "Skills" })).toHaveAttribute("href", `/cvs/7/skills${filters}`);
  expect(tabs.getByRole("link", { name: "Projects" })).toHaveAttribute("href", `/cvs/7/projects${filters}`);
  expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "CVs" }))
    .toHaveAttribute("href", `/cvs${filters}`);
  expect(getCvPreview).toHaveBeenCalledWith("7", `/cvs/7/preview${filters}`);
});

it.each([
  ["2026-11-24", 3],
  ["2026-11-25", 4],
  ["2022-11-25", 0],
])("counts only completed years as of %s", (date, years) => {
  const preview = buildCvPreview({ ...source, projects: source.projects!.slice(0, 1) }, categories, new Date(date));
  expect(preview).toMatchObject({
    skillGroups: [{ skills: [{ name: "React", years, lastUsed: Math.min(Number(date.slice(0, 4)), 2024) }, { name: "Redux", years: null }] }],
  });
});

it("uses the most recent end date even if another matching project started later", () => {
  const [first, last] = source.projects!;
  const preview = buildCvPreview({
    ...source,
    projects: [
      { ...first, end_date: "2025-06-01" },
      { ...last, end_date: "2025-02-03" },
      { ...last, start_date: "2027-01-01" },
      { ...last, start_date: "2020-02-30" },
    ],
  }, categories, today);
  expect(preview).toMatchObject({ skillGroups: [{ skills: [{ name: "React", years: 4, lastUsed: 2025 }, {}] }] });
});

it("announces loading and disables export", () => {
  render(<CvPreviewLoading />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading CV preview…");
  expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
});

it("disables export when required information is missing", async () => {
  vi.mocked(getCvPreview).mockResolvedValue(buildCvPreview({ ...source, education: null }, categories, today));
  await renderPage();
  expect(await screen.findByText("CV preview is not available.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
});

it("offers a retry when loading fails", async () => {
  vi.mocked(getCvPreview).mockResolvedValue(null);
  await renderPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load CV preview");
  expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refresh).toHaveBeenCalledOnce();
});

it("exports the visible document, retries a failed download and uses the returned UTF-8 filename", async () => {
  vi.mocked(getCvPreview).mockResolvedValue(buildCvPreview({
    ...source,
    skills: [],
    projects: [],
    user: { ...source.user!, profile: { full_name: "Ada Example", languages: [] } },
  }, categories, today));
  const response = Promise.withResolvers<Response>();
  const fetchPdf = vi.fn().mockReturnValueOnce(response.promise).mockResolvedValueOnce(new Response("PDF", {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename*=UTF-8''d%C3%A9veloppeuse.pdf",
    },
  }));
  vi.stubGlobal("fetch", fetchPdf);
  vi.stubGlobal("URL", Object.assign(class extends URL {}, {
    createObjectURL: vi.fn(() => "blob:cv-preview"),
    revokeObjectURL: vi.fn(),
  }));
  const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe("développeuse.pdf");
  });

  await renderPage();
  await screen.findByRole("heading", { name: "Ada Example" });
  expect(screen.queryByRole("heading", { name: /Projects|Professional skills|Domains|Language proficiency/ })).not.toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Export PDF" });
  await userEvent.click(button);
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleName("Exporting…");
  expect(fetchPdf.mock.calls[0][1]).toMatchObject({
    method: "POST",
    body: expect.stringContaining("Ada Example"),
  });
  expect(fetchPdf.mock.calls[0][1].body).not.toContain("data-cv-export-controls");
  await act(async () => response.resolve(new Response(null, { status: 502 })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to export PDF. Try again.");

  await userEvent.click(button);
  await waitFor(() => expect(download).toHaveBeenCalledOnce());
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

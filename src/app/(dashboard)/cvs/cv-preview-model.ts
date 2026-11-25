import type { EmployeeLanguage, SkillCategory } from "../employees/[employeeId]/employee-profile-data";
import type { CvProject } from "./cv-projects-model";

type PreviewSkill = { name: string; categoryId: string | null };
type PreviewProject = Pick<CvProject, "id" | "start_date" | "end_date" | "roles" | "responsibilities"> & {
  project: Pick<CvProject["project"], "name" | "domain" | "description" | "environment">;
};

export type CvPreviewSource = {
  name: string;
  education: string | null;
  description: string;
  user: {
    id: string;
    position: { name: string } | null;
    profile: { full_name: string | null; languages: EmployeeLanguage[] };
  } | null;
  skills: PreviewSkill[];
  projects: PreviewProject[] | null;
};

type SkillUsage = { first: string; last: string };
type SkillGroup = {
  id: string | null;
  name: string;
  order: number;
  skills: { name: string; years: number | null; lastUsed: number | null }[];
};

const lookupKey = (value: string) => value.trim().toLowerCase();
const nonBlank = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function getSkillUsage(projects: PreviewProject[], today: string) {
  const usage = new Map<string, SkillUsage>();
  for (const { start_date: start, end_date: end, project } of projects) {
    if (!calendarDate(start) || start > today || (end && (!calendarDate(end) || end < start))) continue;
    const last = end && end < today ? end : today;
    for (const technology of nonBlank(project.environment)) {
      const key = lookupKey(technology);
      const previous = usage.get(key);
      usage.set(key, {
        first: previous && previous.first < start ? previous.first : start,
        last: previous && previous.last > last ? previous.last : last,
      });
    }
  }
  return usage;
}

function formatMonth(value: string) {
  return calendarDate(value) ? `${value.slice(5, 7)}.${value.slice(0, 4)}` : "—";
}

export function buildCvPreview(cv: CvPreviewSource, categories: SkillCategory[], now = new Date()) {
  const name = cv.name.trim();
  const education = cv.education?.trim();
  const description = cv.description.trim();
  const profile = cv.user?.profile;
  const employee = profile?.full_name?.trim();
  const position = cv.user?.position?.name.trim();
  if (!name || !education || !description || !profile || !employee || !position) {
    return { status: "empty", name } as const;
  }

  const today = now.toISOString().slice(0, 10);
  const year = Number(today.slice(0, 4));
  const projects = cv.projects ?? [];
  const usage = getSkillUsage(projects, today);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map<string | null, SkillGroup>();
  for (const skill of cv.skills) {
    const category = skill.categoryId ? categoryById.get(skill.categoryId) : undefined;
    const id = category?.id ?? null;
    const group = groups.get(id) ?? {
      id, name: category?.name ?? "Other skills", order: category?.order ?? Infinity, skills: [],
    };
    const dates = usage.get(lookupKey(skill.name));
    group.skills.push({
      name: skill.name,
      years: dates ? year - Number(dates.first.slice(0, 4)) - Number(today.slice(5) < dates.first.slice(5)) : null,
      lastUsed: dates ? Number(dates.last.slice(0, 4)) : null,
    });
    groups.set(id, group);
  }

  const domains = new Map<string, string>();
  for (const domain of nonBlank(projects.map(({ project }) => project.domain))) {
    const key = lookupKey(domain);
    if (!domains.has(key)) domains.set(key, domain);
  }

  return {
    status: "ready",
    name,
    education,
    description,
    employee,
    position,
    languages: profile.languages,
    domains: [...domains.values()],
    skillGroups: [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "en")),
    projects: projects.map(({ id, project, start_date, end_date, roles, responsibilities }) => ({
      id,
      name: project.name,
      description: project.description,
      environment: nonBlank(project.environment),
      period: `${formatMonth(start_date)} - ${end_date ? formatMonth(end_date) : "Present"}`,
      roles: nonBlank(roles),
      responsibilities: nonBlank(responsibilities),
    })),
  } as const;
}

export type CvPreviewDocumentData = Extract<ReturnType<typeof buildCvPreview>, { status: "ready" }>;

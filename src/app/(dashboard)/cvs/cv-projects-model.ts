export type CatalogProject = {
  id: string;
  name: string;
  domain: string;
  description: string;
  environment: string[];
  start_date: string;
  end_date: string | null;
};

export type CvProject = {
  id: string;
  project: CatalogProject;
  start_date: string;
  end_date: string | null;
  roles: string[];
  responsibilities: string[];
};

export type ProjectOptions = { projects: CatalogProject[]; roles: string[] };

export const projectSortLabels = { name: "Name", start_date: "Start Date", end_date: "End Date" } as const;
export type ProjectSort = keyof typeof projectSortLabels;
export type ProjectsQuery = { search: string; sort: ProjectSort; direction: "asc" | "desc" };

type SearchParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function readProjectsQuery(params: SearchParams): ProjectsQuery {
  function read(key: string) {
    const value = params instanceof URLSearchParams ? params.getAll(key) : params[key];
    return Array.isArray(value) ? (value.length === 1 ? value[0] : undefined) : value;
  }
  const sort = read("project_sort");
  return {
    search: read("project_search") ?? "",
    sort: sort === "name" || sort === "start_date" ? sort : "end_date",
    direction: read("project_order") === "asc" ? "asc" : "desc",
  };
}

export function filterCvProjects(projects: CvProject[], { search, sort, direction }: ProjectsQuery) {
  const term = search.trim().toLowerCase();
  const value = (item: CvProject) => sort === "name" ? item.project.name : item[sort] ?? "9999-12-31";
  return projects
    .filter(({ project }) => [project.name, project.domain].some((text) => text.toLowerCase().includes(term)))
    .sort((a, b) => (direction === "asc" ? 1 : -1) * value(a).localeCompare(value(b), "en", { sensitivity: "base" })
      || a.project.name.localeCompare(b.project.name, "en") || a.id.localeCompare(b.id, "en", { numeric: true }));
}

export function projectDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

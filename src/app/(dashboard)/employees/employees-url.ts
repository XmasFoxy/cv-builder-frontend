export type EmployeesSortField = "first_name" | "last_name";

export type EmployeesSort = {
  sort_by: EmployeesSortField;
  sort_order: "ASC" | "DESC";
};

export type EmployeesQuery = {
  search: string;
  page: number;
  sort?: EmployeesSort;
};

export function employeesHref({
  search,
  page = 1,
  sort,
}: Omit<EmployeesQuery, "page"> & { page?: number }): "/employees" | `/employees?${string}` {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  if (sort) {
    params.set("sort_by", sort.sort_by);
    params.set("sort_order", sort.sort_order);
  }

  const query = params.toString();
  return query ? `/employees?${query}` : "/employees";
}

export const employeeProfileTabs = { profile: "Profile", skills: "Skills", languages: "Languages" } as const;
export type EmployeeProfileTab = keyof typeof employeeProfileTabs;

export type EmployeeProfileDestination = `/employees/${string}`;

export function employeeProfileHref(
  id: string, query: EmployeesQuery, tab: EmployeeProfileTab = "profile",
): EmployeeProfileDestination {
  const section = tab === "profile" ? "" : `/${tab}`;
  const suffix = employeesHref(query).slice("/employees".length);
  return `/employees/${encodeURIComponent(id)}${section}${suffix}`;
}

export function isEmployeeId(id: string) {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 && value <= 2_147_483_647 && String(value) === id;
}

type SearchParam = string | string[] | undefined;

export function readEmployeesQuery(params: Record<string, SearchParam>): EmployeesQuery {
  return {
    search: typeof params.search === "string" ? params.search.trim() : "",
    page: readEmployeesPage(params.page),
    sort: readEmployeesSort(params.sort_by, params.sort_order),
  };
}

export function readEmployeesSort(sortBy: SearchParam, sortOrder: SearchParam): EmployeesSort | undefined {
  if (
    (sortBy === "first_name" || sortBy === "last_name") &&
    (sortOrder === "ASC" || sortOrder === "DESC")
  ) {
    return { sort_by: sortBy, sort_order: sortOrder };
  }
}

export function readEmployeesPage(value: SearchParam) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;

  const page = Number(value);
  // GraphQL Int is signed and 32-bit.
  return page <= 2_147_483_647 ? page : 1;
}

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

type SearchParam = string | string[] | undefined;

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

export function employeesHref(search: string, page = 1): "/employees" | `/employees?${string}` {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/employees?${query}` : "/employees";
}

export function readEmployeesPage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;

  const page = Number(value);
  // GraphQL Int is signed and 32-bit.
  return page <= 2_147_483_647 ? page : 1;
}

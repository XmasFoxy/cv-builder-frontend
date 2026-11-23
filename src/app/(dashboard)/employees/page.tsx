import { EmployeesResults } from "./employees-results";
import { EmployeesSearch } from "./employees-search";
import { readEmployeesPage, readEmployeesSort } from "./employees-url";

export default async function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const page = readEmployeesPage(params.page);
  const sort = readEmployeesSort(params.sort_by, params.sort_order);

  return (
    <section className="font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-base font-medium">Employees</h1>
      <EmployeesSearch search={search} sort={sort} />
      <EmployeesResults query={{ page, search, sort }} />
    </section>
  );
}

import { EmployeesResults } from "./employees-results";
import { EmployeesSearch } from "./employees-search";
import { readEmployeesQuery } from "./employees-url";

export default async function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  const query = readEmployeesQuery(await searchParams);

  return (
    <section className="font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-base font-medium">Employees</h1>
      <EmployeesSearch search={query.search} sort={query.sort} />
      <EmployeesResults query={query} />
    </section>
  );
}

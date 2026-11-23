import { Suspense } from "react";

import { EmployeesResults } from "./employees-results";
import { EmployeesSearch } from "./employees-search";
import { EmployeesTable } from "./employees-table";
import { employeesHref, readEmployeesPage } from "./employees-url";

export default async function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const page = readEmployeesPage(params.page);

  return (
    <section className="font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-base font-medium">Employees</h1>
      <EmployeesSearch search={search} />
      <Suspense key={employeesHref(search, page)} fallback={<EmployeesTable />}>
        <EmployeesResults page={page} search={search} />
      </Suspense>
    </section>
  );
}

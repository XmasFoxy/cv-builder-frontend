import { EmployeesTable } from "./employees-table";

export default function Loading() {
  return (
    <section className="font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-base font-medium">Employees</h1>
      <EmployeesTable />
    </section>
  );
}

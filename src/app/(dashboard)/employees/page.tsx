import { requireSession } from "@/lib/session";

export default async function EmployeesPage() {
  await requireSession("/employees");

  return (
    <section>
      <h1 className="text-xl font-medium">Employees</h1>

      <p className="mt-4 text-sm text-[#888888]">
        Employees will be displayed here.
      </p>
    </section>
  );
}

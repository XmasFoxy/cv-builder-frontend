import { getEmployees } from "./employees-data";

export default async function EmployeesPage() {
  const { items, total } = await getEmployees();

  return (
    <section>
      <h1 className="text-xl font-medium">Employees</h1>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[#666666]">No employees found.</p>
      ) : (
        <>
          {total > items.length && (
            <p className="mt-4 text-sm text-[#666666]">
              Showing {items.length} of {total} employees
            </p>
          )}
          <ul className="mt-4 divide-y divide-[#dedee0] rounded-md border border-[#dedee0]">
            {items.map(({ id, email }) => (
              <li key={id} className="break-all px-4 py-3 text-sm">
                {email}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

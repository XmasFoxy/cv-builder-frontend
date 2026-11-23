import { getEmployees } from "./employees-data";
import { EmployeesTable } from "./employees-table";

export default async function EmployeesPage() {
  const result = await getEmployees();

  return <EmployeesTable result={result} />;
}

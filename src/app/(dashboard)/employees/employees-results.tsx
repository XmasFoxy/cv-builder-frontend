import Link from "next/link";
import { redirect } from "next/navigation";

import { getEmployees } from "./employees-data";
import { EmployeesTable } from "./employees-table";
import { employeesHref } from "./employees-url";

const pageLinkClassName =
  "rounded px-2 py-1 hover:bg-[#e3e3e3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]";

export async function EmployeesResults({ page, search }: { page: number; search: string }) {
  const result = await getEmployees({ page, search });
  const { items, page: currentPage, limit, total, total_pages: totalPages } = result;

  const lastPage = Math.max(1, totalPages);
  if (currentPage > lastPage) redirect(employeesHref(search, lastPage));

  const offset = (currentPage - 1) * limit;

  return (
    <>
      <EmployeesTable result={result} />
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#626262]">
          <p>Showing {offset + 1}–{offset + items.length} of {total} employees</p>
          <nav aria-label="Employees pagination" className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link className={pageLinkClassName} href={employeesHref(search, currentPage - 1)} prefetch={false}>
                Previous
              </Link>
            ) : (
              <span className="px-2 py-1 opacity-60">Previous</span>
            )}
            <span aria-current="page" className="rounded bg-[#e3e3e3] px-2 py-1 font-semibold text-[#2e2e2e]">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link className={pageLinkClassName} href={employeesHref(search, currentPage + 1)} prefetch={false}>
                Next
              </Link>
            ) : (
              <span className="px-2 py-1 opacity-60">Next</span>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

import { redirect } from "next/navigation";
import { cache, Suspense } from "react";

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";

import { getEmployees } from "./employees-data";
import { EmployeesRows, EmployeesTable } from "./employees-table";
import { employeesHref, type EmployeesQuery } from "./employees-url";

const pageLinkClassName =
  "h-auto rounded px-2 py-1 text-sm font-normal hover:bg-[#e3e3e3] focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]";

const readResults = cache(async (query: EmployeesQuery) => {
  const result = await getEmployees(query);
  const lastPage = Math.max(1, result.total_pages);
  if (result.page > lastPage) redirect(employeesHref({ ...query, page: lastPage }));
  return result;
});

export function EmployeesResults({ query }: { query: EmployeesQuery }) {
  const href = employeesHref(query);

  return (
    <>
      <EmployeesTable search={query.search} sort={query.sort}>
        <Suspense key={href} fallback={<EmployeesRows />}>
          <EmployeesResultRows query={query} />
        </Suspense>
      </EmployeesTable>
      <Suspense key={href} fallback={null}>
        <EmployeesPagination query={query} />
      </Suspense>
    </>
  );
}

async function EmployeesResultRows({ query }: { query: EmployeesQuery }) {
  const { items } = await readResults(query);
  return <EmployeesRows items={items} query={query} />;
}

async function EmployeesPagination({ query }: { query: EmployeesQuery }) {
  const { items, page: currentPage, limit, total, total_pages: totalPages } = await readResults(query);
  if (totalPages <= 1) return null;

  const offset = (currentPage - 1) * limit;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#626262]">
      <p>Showing {offset + 1}–{offset + items.length} of {total} employees</p>
      <Pagination aria-label="Employees pagination" className="mx-0 w-auto">
        <PaginationContent className="gap-2">
          <PaginationItem>
            {currentPage > 1 ? (
              <PaginationLink className={pageLinkClassName} href={employeesHref({ ...query, page: currentPage - 1 })} prefetch={false}>
                Previous
              </PaginationLink>
            ) : (
              <span className="px-2 py-1 opacity-60">Previous</span>
            )}
          </PaginationItem>
          <PaginationItem>
            <span aria-current="page" className="rounded bg-[#e3e3e3] px-2 py-1 font-semibold text-[#2e2e2e]">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            {currentPage < totalPages ? (
              <PaginationLink className={pageLinkClassName} href={employeesHref({ ...query, page: currentPage + 1 })} prefetch={false}>
                Next
              </PaginationLink>
            ) : (
              <span className="px-2 py-1 opacity-60">Next</span>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

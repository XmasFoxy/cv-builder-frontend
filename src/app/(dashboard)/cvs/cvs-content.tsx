import { redirect } from "next/navigation";

import { RetryButton } from "@/components/layout/retry-button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";

import { getCvs, type CvsResult } from "./cvs-data";
import { CvsTable } from "./cvs-table";
import { cvsHref, type CvsQuery } from "./cvs-url";

export async function CvsContent({ query }: { query: CvsQuery }) {
  const result = await getCvs(query);
  if (!result) {
    return (
      <CvsTable query={query} message={
        <>
          <p role="alert">Failed to load CVs</p>
          <RetryButton />
        </>
      } />
    );
  }

  const lastPage = Math.max(result.total_pages, 1);
  if (result.page > lastPage) redirect(cvsHref({ ...query, page: lastPage }));

  return (
    <>
      <CvsTable query={query} items={result.items} message={
        <p role="status">{query.search ? "No CVs found" : "You have no CVs yet"}</p>
      } />
      {result.total_pages > 1 && <CvsPagination query={query} result={result} />}
    </>
  );
}

function CvsPagination({ query, result }: { query: CvsQuery; result: CvsResult }) {
  const { page, limit, total, total_pages: totalPages, items } = result;
  const offset = (page - 1) * limit;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>Showing {offset + 1}–{offset + items.length} of {total} CVs</p>
      <Pagination aria-label="CVs pagination" className="mx-0 w-auto">
        <PaginationContent className="gap-2">
          <PaginationItem>
            {page > 1 ? (
              <PaginationLink href={cvsHref({ ...query, page: page - 1 })} prefetch={false} scroll={false}>
                Previous
              </PaginationLink>
            ) : <span className="px-2">Previous</span>}
          </PaginationItem>
          <PaginationItem>
            <span aria-current="page" className="rounded bg-muted px-2 py-1 font-semibold text-foreground">
              Page {page} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            {page < totalPages ? (
              <PaginationLink href={cvsHref({ ...query, page: page + 1 })} prefetch={false} scroll={false}>
                Next
              </PaginationLink>
            ) : <span className="px-2">Next</span>}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

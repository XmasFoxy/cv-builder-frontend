import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { CvSummary } from "./cvs-data";
import { cvsHref, type CvsQuery } from "./cvs-url";

export function CvsTable({
  query,
  items,
  message = (
    <p role="status" className="flex items-center gap-3">
      <span className="size-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" aria-hidden="true" />
      Loading CVs…
    </p>
  ),
}: {
  query?: CvsQuery;
  items?: CvSummary[];
  message?: ReactNode;
}) {
  const descending = query?.sortOrder === "DESC";
  const SortIcon = descending ? ArrowDown : ArrowUp;

  return (
    <Table aria-label="CVs" className="mt-3 table-fixed">
      <TableHeader>
        <TableRow className="border-[var(--cvs-divider)]">
          <TableHead scope="col" aria-sort={descending ? "descending" : "ascending"} className="w-[35%] px-4 py-4">
            {query ? (
              <Link
                aria-label={`Name, sort ${descending ? "ascending" : "descending"}`}
                href={cvsHref({ ...query, page: 1, sortOrder: descending ? "ASC" : "DESC" })}
                prefetch={false}
                scroll={false}
                className="inline-flex items-center gap-1 rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                Name
                <SortIcon aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                Name
                <SortIcon aria-hidden="true" className="size-4" />
              </span>
            )}
          </TableHead>
          <TableHead scope="col" className="w-[29%] px-4 py-4">Education</TableHead>
          <TableHead scope="col" className="px-4 py-4">Employee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map(({ id, name, education, user, description }) => (
          <Fragment key={id}>
            <TableRow className={description ? "border-0" : "border-[var(--cvs-divider)] last:border-0"}>
              <TableCell className="px-4 py-6 align-top wrap-anywhere">{name}</TableCell>
              <TableCell className="px-4 py-6 align-top wrap-anywhere">{education}</TableCell>
              <TableCell className="px-4 py-6 align-top wrap-anywhere">{user?.email}</TableCell>
            </TableRow>
            {description && (
              <TableRow className="border-[var(--cvs-divider)] last:border-0">
                <TableCell colSpan={3} className="px-4 pt-0 pb-4 text-base leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted-foreground">
                  {description}
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
        {!items?.length && (
          <TableRow className="border-0">
            <TableCell colSpan={3} className="px-4 py-6 text-muted-foreground">{message}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

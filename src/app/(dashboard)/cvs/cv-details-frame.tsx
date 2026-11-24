import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cvsHref, type CvsQuery } from "./cvs-url";

export function CvDetailsFrame({ query, name, creating, children }: {
  query: CvsQuery;
  name?: string;
  creating?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={cvsHref(query)} prefetch={false} className="rounded hover:underline focus-visible:outline-2">CVs</Link></li>
          {name && (
            <li className="inline-flex min-w-0 items-center gap-2 text-[#b31f24]">
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="wrap-anywhere">{name}</span>
            </li>
          )}
          <li aria-current="page" className="inline-flex items-center gap-2">
            <ChevronRight aria-hidden="true" className="size-4" />
            {creating ? "Create CV" : "Details"}
          </li>
        </ol>
      </nav>
      <h1 className="mt-4 flex min-h-12 w-36 items-center justify-center border-b-2 border-[#c42529] text-sm font-semibold text-[#b31f24] uppercase">
        Details
      </h1>
      <div className="mx-auto max-w-[852px] pt-4">{children}</div>
    </>
  );
}

export function CvDetailsLoading() {
  return (
    <div role="status">
      <span>Loading CV details…</span>
      <div aria-hidden="true" className="mx-auto mt-16 max-w-[852px] space-y-5 motion-safe:animate-pulse">
        <div className="h-12 border border-[var(--cvs-divider)]" />
        <div className="h-12 border border-[var(--cvs-divider)]" />
        <div className="h-44 border border-[var(--cvs-divider)]" />
      </div>
    </div>
  );
}

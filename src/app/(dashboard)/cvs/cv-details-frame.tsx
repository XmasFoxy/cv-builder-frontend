import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cvDetailsHref, cvPreviewHref, cvProjectsHref, cvSkillsHref, cvsHref, type CvsQuery } from "./cvs-url";

const tabs = {
  Details: cvDetailsHref,
  Skills: cvSkillsHref,
  Projects: cvProjectsHref,
  Preview: cvPreviewHref,
} as const;
const tabClass = "flex min-h-12 items-center justify-center border-b-2 border-transparent px-1 py-2 text-center text-xs font-semibold uppercase @sm:text-sm";

export function CvDetailsFrame({ cvId, query, name, creating, tab = "Details", children }: {
  cvId?: string;
  query: CvsQuery;
  name?: string;
  creating?: boolean;
  tab?: keyof typeof tabs;
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
            {creating ? "Create CV" : tab}
          </li>
        </ol>
      </nav>
      {cvId ? (
        <>
          <h1 className="sr-only">{tab}{name ? ` for ${name}` : ""}</h1>
          <nav aria-label="CV sections">
            <ul className="mt-4 grid max-w-[600px] grid-cols-4">
              {Object.entries(tabs).map(([label, href]) => (
                <li key={label} className="min-w-0">
                  <Link href={href(cvId, query)} prefetch={false} aria-current={label === tab ? "page" : undefined}
                    className={`${tabClass} hover:text-[#b31f24] focus-visible:outline-2 focus-visible:-outline-offset-2 aria-[current=page]:border-[#c42529] aria-[current=page]:text-[#b31f24]`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <h1 className="mt-4 flex min-h-12 w-36 items-center justify-center border-b-2 border-[#c42529] text-sm font-semibold text-[#b31f24] uppercase">
          Details
        </h1>
      )}
      <div className={tab === "Projects" ? "pt-2" : "mx-auto max-w-[852px] pt-4"}>{children}</div>
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

import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RetryButton } from "@/components/layout/retry-button";

import { getCvDetails } from "../cv-details-data";
import { EditableCvForm } from "../cv-form";
import { cvsHref, readCvsQuery } from "../cvs-url";

export const metadata: Metadata = { title: "CV Details | CV Builder" };

export default function CvDetailsPage(props: PageProps<"/cvs/[cvId]">) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<DetailsLoading />}>
        <DetailsContent {...props} />
      </Suspense>
    </section>
  );
}

async function DetailsContent({ params, searchParams }: PageProps<"/cvs/[cvId]">) {
  const [{ cvId }, search] = await Promise.all([params, searchParams]);
  const query = readCvsQuery(search);
  const cv = await getCvDetails(cvId, query);
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={cvsHref(query)} prefetch={false} className="rounded hover:underline focus-visible:outline-2">CVs</Link></li>
          {cv && (
            <li className="inline-flex min-w-0 items-center gap-2 text-[#b31f24]">
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="wrap-anywhere">{cv.name}</span>
            </li>
          )}
          <li aria-current="page" className="inline-flex items-center gap-2">
            <ChevronRight aria-hidden="true" className="size-4" />
            Details
          </li>
        </ol>
      </nav>
      <h1 className="mt-4 flex min-h-12 w-36 items-center justify-center border-b-2 border-[#c42529] text-sm font-semibold text-[#b31f24] uppercase">
        Details
      </h1>
      <div className="mx-auto max-w-[852px] pt-4">
        {cv ? <EditableCvForm key={cv.id} cv={cv} action="Update" /> : (
          <div className="mt-8 text-center">
            <p role="alert">Failed to load CV details</p>
            <RetryButton />
          </div>
        )}
      </div>
    </>
  );
}

function DetailsLoading() {
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

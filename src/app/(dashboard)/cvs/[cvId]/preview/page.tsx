import type { Metadata } from "next";
import { Suspense } from "react";

import { CvDetailsFrame } from "../../cv-details-frame";
import { CvPreviewContent, CvPreviewLoading } from "../../cv-preview-content";
import { cvPreviewHref, readCvsQuery } from "../../cvs-url";

export const metadata: Metadata = { title: "CV Preview | CV Builder" };

type RouteProps = PageProps<"/cvs/[cvId]/preview">;

export default function CvPreviewPage(props: RouteProps) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<CvPreviewLoading />}>
        <PreviewRoute {...props} />
      </Suspense>
    </section>
  );
}

async function PreviewRoute({ params, searchParams }: RouteProps) {
  const [{ cvId }, search] = await Promise.all([params, searchParams]);
  const query = readCvsQuery(search);
  return (
    <Suspense key={cvPreviewHref(cvId, query)} fallback={
      <CvDetailsFrame cvId={cvId} query={query} tab="Preview"><CvPreviewLoading /></CvDetailsFrame>
    }>
      <CvPreviewContent cvId={cvId} query={query} />
    </Suspense>
  );
}

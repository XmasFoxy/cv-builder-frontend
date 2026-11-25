import type { Metadata } from "next";
import { Suspense } from "react";

import { RetryButton } from "@/components/layout/retry-button";

import { getCvDetails } from "../cv-details-data";
import { CvDetailsFrame, CvDetailsLoading } from "../cv-details-frame";
import { EditableCvForm } from "../cv-form";
import { readCvsQuery } from "../cvs-url";

export const metadata: Metadata = { title: "CV Details | CV Builder" };

export default function CvDetailsPage(props: PageProps<"/cvs/[cvId]">) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<CvDetailsLoading />}>
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
    <CvDetailsFrame cvId={cvId} query={query} name={cv?.name}>
      {cv ? <EditableCvForm key={cv.id} cv={cv} /> : (
        <div className="mt-8 text-center">
          <p role="alert">Failed to load CV details</p>
          <RetryButton />
        </div>
      )}
    </CvDetailsFrame>
  );
}

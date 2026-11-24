import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RetryButton } from "@/components/layout/retry-button";
import { readViewer, type Viewer } from "@/lib/current-employee";
import { isRejected, readAccessToken, redirectForSession } from "@/lib/session";

import { CreateCvForm } from "../create-cv-form";
import { CvDetailsFrame, CvDetailsLoading } from "../cv-details-frame";
import { cvCreateHref, readCvsQuery } from "../cvs-url";

export const metadata: Metadata = { title: "Create CV | CV Builder" };

export default function CreateCvPage({ searchParams }: PageProps<"/cvs/new">) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<CvDetailsLoading />}>
        <CreateCvContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function CreateCvContent({ searchParams }: Pick<PageProps<"/cvs/new">, "searchParams">) {
  const query = readCvsQuery(await searchParams);
  const destination = cvCreateHref(query);
  const token = await readAccessToken(destination);
  let viewer: Viewer | null = null;
  try {
    viewer = await readViewer(token);
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
  }
  if (viewer && viewer.role !== "Employee") notFound();

  return (
    <CvDetailsFrame query={query} creating>
      {viewer ? <CreateCvForm query={query} /> : (
        <div className="mt-8 text-center">
          <p role="alert">Failed to load the CV form</p>
          <RetryButton />
        </div>
      )}
    </CvDetailsFrame>
  );
}

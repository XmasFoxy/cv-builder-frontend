import type { Metadata } from "next";
import { Suspense } from "react";

import { RetryButton } from "@/components/layout/retry-button";

import { CvDetailsFrame } from "../../cv-details-frame";
import { CvSkills } from "../../cv-skills";
import { getCvSkills } from "../../cv-skills-data";
import { cvSkillsHref, readCvsQuery, type CvsQuery } from "../../cvs-url";

export const metadata: Metadata = { title: "CV Skills | CV Builder" };

type RouteProps = PageProps<"/cvs/[cvId]/skills">;

export default function CvSkillsPage(props: RouteProps) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<CvSkillsLoading />}>
        <SkillsRoute {...props} />
      </Suspense>
    </section>
  );
}

async function SkillsRoute({ params, searchParams }: RouteProps) {
  const [{ cvId }, search] = await Promise.all([params, searchParams]);
  const query = readCvsQuery(search);
  return (
    <Suspense key={cvSkillsHref(cvId, query)} fallback={
      <CvDetailsFrame cvId={cvId} query={query} tab="Skills">
        <CvSkillsLoading />
      </CvDetailsFrame>
    }>
      <SkillsContent cvId={cvId} query={query} />
    </Suspense>
  );
}

async function SkillsContent({ cvId, query }: { cvId: string; query: CvsQuery }) {
  const cv = await getCvSkills(cvId, query);
  return (
    <CvDetailsFrame cvId={cvId} query={query} name={cv?.name} tab="Skills">
      {cv ? (
        <CvSkills key={cv.id} cvId={cv.id} skills={cv.skills} ownerSkills={cv.ownerSkills} categories={cv.categories} />
      ) : (
        <div className="mt-8 text-center">
          <p role="alert">Failed to load skills</p>
          <RetryButton />
        </div>
      )}
    </CvDetailsFrame>
  );
}

function CvSkillsLoading() {
  return (
    <div role="status" className="mx-auto max-w-[852px] space-y-6 py-4">
      <p>Loading CV skills…</p>
      <div aria-hidden="true" className="grid gap-4 motion-safe:animate-pulse @lg:grid-cols-2 @4xl:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-10 rounded bg-muted" />)}
      </div>
    </div>
  );
}

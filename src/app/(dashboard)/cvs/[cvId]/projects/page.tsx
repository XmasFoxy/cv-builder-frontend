import type { Metadata } from "next";
import { Suspense } from "react";

import { RetryButton } from "@/components/layout/retry-button";

import { CvDetailsFrame } from "../../cv-details-frame";
import { CvProjects } from "../../cv-projects";
import { getCvProjectOptions, getCvProjects } from "../../cv-projects-data";
import { readProjectsQuery, type ProjectsQuery } from "../../cv-projects-model";
import { CvProjectsTable } from "../../cv-projects-table";
import { cvProjectsHref, readCvsQuery, type CvsQuery } from "../../cvs-url";

export const metadata: Metadata = { title: "CV Projects | CV Builder" };

type RouteProps = PageProps<"/cvs/[cvId]/projects">;

export default function CvProjectsPage(props: RouteProps) {
  return (
    <section data-cvs-page className="@container">
      <Suspense fallback={<CvProjectsLoading />}>
        <ProjectsRoute {...props} />
      </Suspense>
    </section>
  );
}

async function ProjectsRoute({ params, searchParams }: RouteProps) {
  const [{ cvId }, search] = await Promise.all([params, searchParams]);
  const query = readCvsQuery(search);
  return (
    <Suspense key={cvProjectsHref(cvId, query)} fallback={
      <CvDetailsFrame cvId={cvId} query={query} tab="Projects"><CvProjectsLoading /></CvDetailsFrame>
    }>
      <ProjectsContent cvId={cvId} query={query} projectsQuery={readProjectsQuery(search)} />
    </Suspense>
  );
}

async function ProjectsContent({ cvId, query, projectsQuery }: { cvId: string; query: CvsQuery; projectsQuery: ProjectsQuery }) {
  const destination = cvProjectsHref(cvId, query);
  const cv = await getCvProjects(cvId, destination);
  const options = cv ? await getCvProjectOptions(destination) : null;
  return (
    <CvDetailsFrame cvId={cvId} query={query} name={cv?.name} tab="Projects">
      {cv ? <CvProjects key={cv.id} cvId={cv.id} items={cv.projects} options={options} initialQuery={projectsQuery} /> : (
        <CvProjectsTable message={
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert">Failed to load projects</p>
            <RetryButton />
          </div>
        } />
      )}
    </CvDetailsFrame>
  );
}

function CvProjectsLoading() {
  return (
    <CvProjectsTable message={
      <p role="status" className="flex items-center gap-3">
        <span aria-hidden="true" className="size-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />
        Loading CV projects…
      </p>
    } />
  );
}

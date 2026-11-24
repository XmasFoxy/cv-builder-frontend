import { Suspense } from "react";

import { CreateCvDialog } from "./create-cv-dialog";
import { CvsContent } from "./cvs-content";
import { CvsSearch } from "./cvs-search";
import { CvsTable } from "./cvs-table";
import { cvsHref, readCvsQuery } from "./cvs-url";

export default async function CVsPage({ searchParams }: PageProps<"/cvs">) {
  const query = readCvsQuery(await searchParams);
  return (
    <section data-cvs-page>
      <h1 className="text-base font-medium">CVs</h1>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <CvsSearch search={query.search} sortOrder={query.sortOrder} />
        <CreateCvDialog />
      </div>
      <Suspense key={cvsHref(query)} fallback={<CvsTable query={query} />}>
        <CvsContent query={query} />
      </Suspense>
    </section>
  );
}

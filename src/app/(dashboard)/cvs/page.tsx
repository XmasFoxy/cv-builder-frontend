import { Suspense } from "react";

import { CvsContent } from "./cvs-content";
import { CvsSearch } from "./cvs-search";
import { CvsTable } from "./cvs-table";
import { cvsHref, readCvsQuery } from "./cvs-url";

export default async function CVsPage({ searchParams }: PageProps<"/cvs">) {
  const query = readCvsQuery(await searchParams);
  return (
    <section data-cvs-page>
      <h1 className="text-base font-medium">CVs</h1>
      <CvsSearch search={query.search} sortOrder={query.sortOrder} />
      <Suspense key={cvsHref(query)} fallback={<CvsTable query={query} />}>
        <CvsContent query={query} />
      </Suspense>
    </section>
  );
}

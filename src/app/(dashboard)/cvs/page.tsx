import { cn } from "cn";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";

import { CvsContent } from "./cvs-content";
import { CvsSearch } from "./cvs-search";
import { CvsTable } from "./cvs-table";
import { cvCreateHref, cvsHref, readCvsQuery } from "./cvs-url";

export default async function CVsPage({ searchParams }: PageProps<"/cvs">) {
  const query = readCvsQuery(await searchParams);
  return (
    <section data-cvs-page>
      <h1 className="text-base font-medium">CVs</h1>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <CvsSearch search={query.search} sortOrder={query.sortOrder} />
        <Link href={cvCreateHref(query)} prefetch={false}
          className={cn(buttonVariants({ variant: "ghost" }), "ml-auto h-11 gap-2 px-4 text-destructive uppercase hover:text-destructive")}>
          <Plus aria-hidden="true" /> Create CV
        </Link>
      </div>
      <Suspense key={cvsHref(query)} fallback={<CvsTable query={query} />}>
        <CvsContent query={query} />
      </Suspense>
    </section>
  );
}

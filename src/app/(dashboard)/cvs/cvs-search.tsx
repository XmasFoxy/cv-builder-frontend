"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import { cvsHref, readCvsQuery, type CvsQuery } from "./cvs-url";

export function CvsSearch({ search, sortOrder }: Pick<CvsQuery, "search" | "sortOrder">) {
  const router = useRouter();
  const [draft, setDraft] = useState({ value: search, committed: search, submitted: search });
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (draft.committed !== search) {
    setDraft({
      value: draft.submitted === search ? draft.value : search,
      submitted: search,
      committed: search,
    });
  }

  useEffect(() => {
    function restoreSearch() {
      clearTimeout(timeout.current);
      const { search } = readCvsQuery(new URLSearchParams(window.location.search));
      setDraft((current) => ({ ...current, value: search, submitted: search }));
    }

    window.addEventListener("popstate", restoreSearch);
    return () => {
      clearTimeout(timeout.current);
      window.removeEventListener("popstate", restoreSearch);
    };
  }, []);

  function applySearch(value: string) {
    clearTimeout(timeout.current);
    // Read the URL in case the sort changed during the debounce.
    const { sortOrder } = readCvsQuery(new URLSearchParams(window.location.search));
    const search = value.trim();
    setDraft((current) => ({ ...current, submitted: search }));
    router.replace(cvsHref({ search, page: 1, sortOrder }), { scroll: false });
  }

  return (
    <form
      action="/cvs"
      role="search"
      className="relative w-full max-w-80"
      onSubmit={(event) => {
        event.preventDefault();
        applySearch(draft.value);
      }}
    >
      {sortOrder === "DESC" && (
        <>
          <input type="hidden" name="sort_by" value="name" />
          <input type="hidden" name="sort_order" value={sortOrder} />
        </>
      )}
      <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto size-5 text-muted-foreground" />
      <Input
        aria-label="Search CVs by name"
        type="search"
        name="search"
        placeholder="Search"
        value={draft.value}
        onChange={(event) => {
          const value = event.target.value;
          setDraft({ ...draft, value });
          if (value.trim() === draft.value.trim()) return;
          clearTimeout(timeout.current);
          timeout.current = setTimeout(() => applySearch(value), 300);
        }}
        className="h-11 rounded-full border-[var(--cvs-divider)] pr-4 pl-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      />
    </form>
  );
}

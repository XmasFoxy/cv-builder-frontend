"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { employeesHref } from "./employees-url";

export function EmployeesSearch({ search }: { search: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function restoreSearch() {
      clearTimeout(timer.current);
      const params = new URLSearchParams(window.location.search);
      setDraft(params.get("search")?.trim() ?? "");
    }

    window.addEventListener("popstate", restoreSearch);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("popstate", restoreSearch);
    };
  }, []);

  function applySearch(value: string) {
    clearTimeout(timer.current);
    router.replace(employeesHref(value.trim()), { scroll: false });
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (value.trim() === draft.trim()) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(() => applySearch(value), 300);
  }

  return (
    <form
      role="search"
      action="/employees"
      className="relative mt-5 w-full max-w-80"
      onSubmit={(event) => {
        event.preventDefault();
        applySearch(draft);
      }}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 my-auto size-5 text-[#626262]"
      />
      <input
        aria-label="Search employees"
        type="search"
        name="search"
        placeholder="Search"
        value={draft}
        onChange={(event) => updateDraft(event.target.value)}
        className="h-11 w-full rounded-full border border-[#aaa] bg-transparent pr-4 pl-10 text-sm placeholder:text-[#626262] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]"
      />
    </form>
  );
}

"use client";

import { EllipsisVertical, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";

import { RetryButton } from "@/components/layout/retry-button";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { CvProjectDialog, type ProjectIntent } from "./cv-project-dialog";
import { filterCvProjects, readProjectsQuery, type CvProject, type ProjectOptions, type ProjectsQuery, type ProjectSort } from "./cv-projects-model";
import { CvProjectsTable } from "./cv-projects-table";

export function CvProjects({ cvId, items, options, initialQuery }: {
  cvId: string;
  items: CvProject[];
  options: ProjectOptions | null;
  initialQuery: ProjectsQuery;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [intent, setIntent] = useState<ProjectIntent>();
  const [announcement, setAnnouncement] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const results = filterCvProjects(items, query);
  const assignedIds = new Set(items.map(({ project }) => project.id));
  const available = options?.projects.filter(({ id }) => !assignedIds.has(id)) ?? [];
  const returnFocus = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function restoreQuery() {
      setQuery(readProjectsQuery(new URLSearchParams(window.location.search)));
    }
    window.addEventListener("popstate", restoreQuery);
    return () => window.removeEventListener("popstate", restoreQuery);
  }, []);

  function changeQuery(next: ProjectsQuery, recordHistory = false) {
    const url = new URL(window.location.href);
    if (next.search) url.searchParams.set("project_search", next.search);
    else url.searchParams.delete("project_search");
    if (next.sort === "end_date") url.searchParams.delete("project_sort");
    else url.searchParams.set("project_sort", next.sort);
    if (next.direction === "desc") url.searchParams.delete("project_order");
    else url.searchParams.set("project_order", next.direction);
    if (recordHistory) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    setQuery(next);
  }

  function sort(field: ProjectSort) {
    changeQuery({ ...query, sort: field, direction: query.sort === field && query.direction === "asc" ? "desc" : "asc" }, true);
  }

  function openDialog(intent: ProjectIntent, trigger: HTMLButtonElement | null) {
    returnFocus.current = trigger;
    setIntent(intent);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 @4xl:px-4">
        <form role="search" className="relative w-full max-w-80" onSubmit={(event) => event.preventDefault()}>
          <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 my-auto size-5 text-muted-foreground" />
          <Input ref={searchInput} aria-label="Search projects by name or domain" type="search" placeholder="Search" value={query.search}
            onChange={(event) => changeQuery({ ...query, search: event.target.value })}
            className="h-11 rounded-full border-[var(--cvs-divider)] pr-4 pl-10" />
        </form>
        <Button variant="ghost" disabled={!options} className="ml-auto h-11 gap-3 px-4 text-[#b31f24] uppercase"
          onClick={(event) => openDialog({ action: "add", projects: available }, event.currentTarget)}>
          <Plus aria-hidden="true" /> Add project
        </Button>
      </div>
      {!options && (
        <div className="flex flex-wrap items-center gap-3 px-3 text-sm @4xl:px-4">
          <p role="alert">Failed to load project and role options</p>
          <RetryButton />
        </div>
      )}
      <div className="mt-3">
        <CvProjectsTable items={results} query={query} onSort={sort}
          message={<p role="status">{query.search.trim() ? "No projects found" : "No projects added yet"}</p>}
          renderActions={(item) => <ProjectRowActions item={item} canUpdate={Boolean(options)} onAction={openDialog} />} />
      </div>
      {intent && (
        <CvProjectDialog cvId={cvId} intent={intent} roleOptions={options?.roles ?? []}
          returnFocus={() => returnFocus.current?.isConnected ? returnFocus.current : searchInput.current}
          onClose={() => setIntent(undefined)}
          onSaved={(message) => {
            setAnnouncement(message);
            if (intent.action === "remove") returnFocus.current = null;
          }} />
      )}
      <p role="status" className="sr-only">{announcement}</p>
    </div>
  );
}

function ProjectRowActions({ item, canUpdate, onAction }: {
  item: CvProject;
  canUpdate: boolean;
  onAction: (intent: ProjectIntent, trigger: HTMLButtonElement | null) => void;
}) {
  const trigger: RefObject<HTMLButtonElement | null> = useRef(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={trigger} aria-label={`Actions for ${item.project.name}`}
        render={<Button variant="ghost" size="icon" />}>
        <EllipsisVertical aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled={!canUpdate} onClick={() => onAction({ action: "update", item }, trigger.current)}>Update</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => onAction({ action: "remove", item }, trigger.current)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

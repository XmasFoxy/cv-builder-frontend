import { ArrowDown, ArrowUp } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { projectDate, projectSortLabels, type CvProject, type ProjectSort, type ProjectsQuery } from "./cv-projects-model";

export function CvProjectsTable({ query, items, renderActions, onSort, message }: {
  query?: ProjectsQuery;
  items?: CvProject[];
  renderActions?: (item: CvProject) => ReactNode;
  onSort?: (field: ProjectSort) => void;
  message?: ReactNode;
}) {
  function sortHeader(field: ProjectSort, width: string) {
    const current = query?.sort === field;
    const descending = query?.direction === "desc";
    const Icon = descending ? ArrowDown : ArrowUp;
    const label = projectSortLabels[field];
    return (
      <TableHead scope="col" aria-sort={current ? (descending ? "descending" : "ascending") : undefined}
        className={`${width} px-2 py-3 whitespace-normal @4xl:px-4`}>
        {onSort ? (
          <Button variant="ghost" onClick={() => onSort(field)}
            aria-label={`${label}, sort ${current && !descending ? "descending" : "ascending"}`}
            className="h-auto min-h-8 gap-1 px-0 py-1 text-left font-medium whitespace-normal hover:bg-transparent hover:underline">
            {label}
            {current && <Icon aria-hidden="true" className="size-4" />}
          </Button>
        ) : label}
      </TableHead>
    );
  }

  return (
    <Table aria-label="CV projects" className="min-w-[29rem] table-fixed">
      <TableHeader>
        <TableRow className="border-[var(--cvs-divider)]">
          {sortHeader("name", "w-[23%] @4xl:w-[24%]")}
          <TableHead scope="col" className="w-[17%] px-2 py-3 @4xl:w-[18%] @4xl:px-4">Domain</TableHead>
          <TableHead scope="col" className="px-2 py-3 whitespace-normal break-words @4xl:px-4">Responsibilities</TableHead>
          {sortHeader("start_date", "w-[5.5rem] @4xl:w-[14%]")}
          {sortHeader("end_date", "w-[5.5rem] @4xl:w-[14%]")}
          <TableHead scope="col" className="w-9 @4xl:w-14"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items?.map((item) => {
          const { project, start_date, end_date, responsibilities } = item;
          return (
            <Fragment key={item.id}>
              <TableRow className={project.description ? "border-0" : "border-[var(--cvs-divider)]"}>
                <TableCell className="px-2 py-4 align-top wrap-anywhere @4xl:px-4">{project.name}</TableCell>
                <TableCell className="px-2 py-4 align-top wrap-anywhere @4xl:px-4">{project.domain}</TableCell>
                <TableCell className="px-2 py-4 align-top @4xl:px-4">
                  {responsibilities.length ? (
                    <ul role="list" aria-label="Responsibilities" className="flex flex-wrap gap-1.5">
                      {responsibilities.map((text, index) => (
                        <li key={index} className="max-w-full rounded-xl bg-muted px-2 py-0.5 text-xs wrap-anywhere whitespace-pre-wrap">{text}</li>
                      ))}
                    </ul>
                  ) : <span aria-label="No responsibilities" className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="px-2 py-4 align-top whitespace-nowrap @4xl:px-4">
                  <time dateTime={start_date}>{projectDate(start_date)}</time>
                </TableCell>
                <TableCell className="px-2 py-4 align-top whitespace-nowrap @4xl:px-4">
                  {end_date ? <time dateTime={end_date}>{projectDate(end_date)}</time> : "Till now"}
                </TableCell>
                <TableCell className="px-0 py-2 text-center align-top">{renderActions?.(item)}</TableCell>
              </TableRow>
              {project.description && (
                <TableRow className="border-[var(--cvs-divider)] last:border-0">
                  <TableCell colSpan={6} className="px-3 pt-0 pb-5 leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted-foreground @4xl:px-4">
                    {project.description}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
        {!items?.length && (
          <TableRow className="border-0">
            <TableCell colSpan={6} className="px-3 py-6 text-muted-foreground @4xl:px-4">{message}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

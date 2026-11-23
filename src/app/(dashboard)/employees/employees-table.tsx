import { Avatar } from "@base-ui/react/avatar";
import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { Employee } from "./employees-data";
import { employeesHref, type EmployeesSort, type EmployeesSortField } from "./employees-url";

const columns: { label: string; sortField?: EmployeesSortField }[] = [
  { label: "Avatar" },
  { label: "First Name", sortField: "first_name" },
  { label: "Last Name", sortField: "last_name" },
  { label: "Email" },
  { label: "Department" },
  { label: "Position" },
];

export function EmployeesTable({
  search,
  sort,
  children = <EmployeesRows />,
}: {
  search?: string;
  sort?: EmployeesSort;
  children?: ReactNode;
}) {
  return (
    <Table
      aria-label="Employees"
      className="min-w-[640px]"
      containerProps={{
        role: "region",
        "aria-label": "Employees table",
        tabIndex: 0,
        className: "mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]",
      }}
    >
      <TableHeader>
        <TableRow className="border-b border-[#aaa]">
          {columns.map(({ label, sortField }) => {
            const activeOrder = sort && sort.sort_by === sortField ? sort.sort_order : undefined;
            const nextOrder = activeOrder === "ASC" ? "DESC" : "ASC";
            const Icon = activeOrder === "ASC" ? ArrowUp : activeOrder === "DESC" ? ArrowDown : ArrowDownUp;

            return (
              <TableHead
                key={label}
                scope="col"
                aria-sort={activeOrder ? (activeOrder === "ASC" ? "ascending" : "descending") : undefined}
                className="px-4 py-3 font-semibold first:w-20"
              >
                {sortField && search !== undefined ? (
                  <Link
                    aria-label={`${label}, sort ${nextOrder === "ASC" ? "ascending" : "descending"}`}
                    className="inline-flex items-center gap-1 rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]"
                    href={employeesHref({ search, sort: { sort_by: sortField, sort_order: nextOrder } })}
                    prefetch={false}
                    scroll={false}
                  >
                    {label}
                    <Icon aria-hidden="true" className={activeOrder ? "size-4" : "size-4 text-[#777]"} />
                  </Link>
                ) : (
                  <span className={label === "Avatar" ? "sr-only" : undefined}>{label}</span>
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      {children}
    </Table>
  );
}

export function EmployeesRows({ items }: { items?: Employee[] }) {
  return (
    <TableBody>
      {items?.map(({ id, email, profile, department, position }) => {
        const name = profile.first_name?.trim() || profile.last_name?.trim() || email;
        const [initial] = name;

        return (
          <TableRow key={id} className="h-[72px] border-b border-[#aaa]">
            <TableCell className="px-4 py-3">
              <Avatar.Root
                aria-hidden="true"
                className="grid size-10 place-items-center overflow-hidden rounded-full bg-[#707070] text-base text-white"
              >
                {profile.avatar && (
                  <Avatar.Image
                    src={profile.avatar}
                    alt=""
                    keepMounted
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="col-start-1 row-start-1 size-full object-cover aria-hidden:invisible"
                  />
                )}
                <Avatar.Fallback className="col-start-1 row-start-1">
                  {initial?.toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-normal wrap-anywhere">{profile.first_name}</TableCell>
            <TableCell className="px-4 py-3 whitespace-normal wrap-anywhere">{profile.last_name}</TableCell>
            <TableCell className="px-4 py-3 whitespace-normal wrap-anywhere">{email}</TableCell>
            <TableCell className="px-4 py-3 whitespace-normal wrap-anywhere">{department?.name}</TableCell>
            <TableCell className="px-4 py-3 whitespace-normal wrap-anywhere">{position?.name}</TableCell>
          </TableRow>
        );
      })}
      {!items?.length && (
        <TableRow>
          <TableCell colSpan={columns.length} className="px-4 py-6 text-[#626262]">
            {items ? (
              "No users found"
            ) : (
              <p role="status" className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
                />
                Loading employees…
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

import { ChevronRight, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { employeesHref, readEmployeesQuery, type EmployeesQuery } from "../employees-url";
import { getEmployeeProfile } from "./employee-profile-data";
import { EmployeeProfileDetails } from "./employee-profile";
import Loading from "./loading";
import { RetryProfileButton } from "./retry-profile-button";

export const metadata: Metadata = { title: "Employee profile | CV Builder" };

export default async function EmployeeProfilePage({ params, searchParams }: PageProps<"/employees/[employeeId]">) {
  const [{ employeeId }, search] = await Promise.all([params, searchParams]);
  const query = readEmployeesQuery(search);
  const backHref = employeesHref(query);

  return (
    <section className="@container font-[family-name:var(--font-geist-sans)]">
      <Suspense key={`${employeeId}:${backHref}`} fallback={<><ProfileHeader backHref={backHref} /><Loading /></>}>
        <ProfileContent employeeId={employeeId} query={query} />
      </Suspense>
    </section>
  );
}

function ProfileHeader({ backHref, name }: { backHref: ReturnType<typeof employeesHref>; name?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-[#626262]">
          <li>
            <Link
              href={backHref}
              prefetch={false}
              className="rounded hover:text-[#2e2e2e] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]"
            >
              Employees
            </Link>
          </li>
          {name && (
            <li className="inline-flex min-w-0 items-center gap-2 text-[#b31f24]">
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[#626262]" />
              <UserRound aria-hidden="true" className="size-4 shrink-0" />
              <span className="wrap-anywhere">{name}</span>
            </li>
          )}
          <li aria-current="page" className="inline-flex items-center gap-2">
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            Profile
          </li>
        </ol>
      </nav>
      <div aria-hidden="true" className="mt-4 w-36 border-b-2 border-[#c42529] py-3 text-center text-sm font-semibold uppercase text-[#b31f24]">
        Profile
      </div>
    </>
  );
}

async function ProfileContent({ employeeId, query }: { employeeId: string; query: EmployeesQuery }) {
  const result = await getEmployeeProfile(employeeId, query);
  const backHref = employeesHref(query);
  if (result.status === "found") {
    const { employee } = result;
    const { first_name, last_name } = employee.profile;
    const name = [first_name?.trim(), last_name?.trim()].filter(Boolean).join(" ") || employee.email;
    return <><ProfileHeader backHref={backHref} name={name} /><EmployeeProfileDetails employee={employee} name={name} /></>;
  }

  return (
    <>
      <ProfileHeader backHref={backHref} />
      <div className="mx-auto mt-12 max-w-[852px] text-center">
        {result.status === "missing" ? (
          <>
            <h1 className="text-2xl font-medium">Employee not found</h1>
            <p className="mt-2 text-[#626262]">The employee may have been removed from the list.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-medium">Failed to load profile information</h1>
            <RetryProfileButton />
          </>
        )}
      </div>
    </>
  );
}

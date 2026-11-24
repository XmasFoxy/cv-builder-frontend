import { ChevronRight, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { RetryButton } from "@/components/layout/retry-button";

import {
  employeeProfileHref, employeeProfileTabs, employeesHref, readEmployeesQuery,
  type EmployeeProfileTab, type EmployeesQuery,
} from "../employees-url";
import type { EmployeeDetailsResult, EmployeeIdentity } from "./employee-profile-data";
import { EmployeeDetailsLoading } from "./employee-details-loading";

export type EmployeeDetailsRouteProps = PageProps<"/employees/[employeeId]">;

type DetailsProps<Data> = {
  tab: EmployeeProfileTab;
  load: (id: string, query: EmployeesQuery) => Promise<EmployeeDetailsResult<Data>>;
  renderDetails: (data: Data, name: string) => ReactNode;
};

type NavigationProps = { employeeId: string; query: EmployeesQuery; tab: EmployeeProfileTab };

export async function EmployeeDetailsPage<Data extends { user: EmployeeIdentity }>({
  params, searchParams, tab, load, renderDetails,
}: EmployeeDetailsRouteProps & DetailsProps<Data>) {
  const [{ employeeId }, search] = await Promise.all([params, searchParams]);
  const query = readEmployeesQuery(search);
  const navigation = { employeeId, query, tab };

  return (
    <section className="@container font-[family-name:var(--font-geist-sans)]">
      <Suspense
        key={employeeProfileHref(employeeId, query, tab)}
        fallback={<><DetailsNavigation {...navigation} /><EmployeeDetailsLoading tab={tab} /></>}
      >
        <DetailsContent {...navigation} load={load} renderDetails={renderDetails} />
      </Suspense>
    </section>
  );
}

function DetailsNavigation({ employeeId, query, tab, name }: NavigationProps & { name?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-[#626262]">
          <li>
            <Link
              href={employeesHref(query)}
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
            {employeeProfileTabs[tab]}
          </li>
        </ol>
      </nav>
      <nav aria-label="Employee profile">
        <ul className="mt-4 grid w-full max-w-[450px] grid-cols-3">
          {(Object.entries(employeeProfileTabs) as [EmployeeProfileTab, string][]).map(([key, label]) => (
            <li key={key} className="min-w-0">
              <Link
                href={employeeProfileHref(employeeId, query, key)}
                aria-current={key === tab ? "page" : undefined}
                prefetch={false}
                className="flex min-h-12 items-center justify-center border-b-2 border-transparent px-1 py-2 text-center text-xs font-semibold uppercase hover:text-[#b31f24] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#626262] aria-[current=page]:border-[#c42529] aria-[current=page]:text-[#b31f24] @sm:text-sm"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

const loadErrors = {
  profile: "Failed to load profile information",
  skills: "Failed to load skills",
  languages: "Failed to load languages",
} satisfies Record<EmployeeProfileTab, string>;

async function DetailsContent<Data extends { user: EmployeeIdentity }>({
  load, renderDetails, ...navigation
}: NavigationProps & DetailsProps<Data>) {
  const result = await load(navigation.employeeId, navigation.query);
  if (result.status === "found") {
    const { first_name, last_name } = result.data.user.profile;
    const name = [first_name?.trim(), last_name?.trim()].filter(Boolean).join(" ") || result.data.user.email;
    return (
      <>
        <DetailsNavigation {...navigation} name={name} />
        {renderDetails(result.data, name)}
      </>
    );
  }

  return (
    <>
      <DetailsNavigation {...navigation} />
      <div className="mx-auto mt-12 max-w-[852px] text-center">
        {result.status === "missing" ? (
          <>
            <h1 className="text-2xl font-medium">Employee not found</h1>
            <p className="mt-2 text-[#626262]">The employee may have been removed from the list.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-medium">{loadErrors[navigation.tab]}</h1>
            <RetryButton />
          </>
        )}
      </div>
    </>
  );
}

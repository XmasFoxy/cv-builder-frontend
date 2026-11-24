import type { EmployeeProfileTab } from "../employees-url";

export function EmployeeDetailsLoading({ tab }: { tab: EmployeeProfileTab }) {
  if (tab === "profile") {
    return (
      <div role="status" className="mx-auto flex max-w-[852px] flex-col items-center gap-4 pt-5 text-[#626262]">
        <span aria-hidden="true" className="size-[120px] rounded-full bg-[#e3e3e6] motion-safe:animate-pulse" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[852px] pt-8">
      {tab === "languages" && <h2>Current Languages</h2>}
      <div role="status" className="mt-5 text-[#626262]">
        Loading {tab}…
        <div aria-hidden="true" className="mt-4 h-4 w-48 max-w-full rounded bg-[#e3e3e6] motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

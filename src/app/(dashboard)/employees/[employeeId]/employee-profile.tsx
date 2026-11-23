import { EmployeeAvatar } from "../employee-avatar";
import type { EmployeeProfile } from "./employee-profile-data";

const membershipDateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export function EmployeeProfileDetails({ employee, name }: { employee: EmployeeProfile; name: string }) {
  const { profile, email, department, position, created_at } = employee;
  const firstName = profile.first_name?.trim();
  const lastName = profile.last_name?.trim();
  const names = [firstName, lastName].filter((part): part is string => Boolean(part));
  const initials = (names.length ? names : [email])
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  // GraphQL can serialize Date to a string containing the Unix timestamp in milliseconds.
  const memberSince = new Date(/^\d+$/.test(created_at) ? Number(created_at) : created_at);
  const hasMembershipDate = Number.isFinite(memberSince.getTime());
  const fields = [
    { label: "First Name", value: firstName },
    { label: "Last Name", value: lastName },
    { label: "Department", value: department?.name },
    { label: "Position", value: position?.name },
  ];

  return (
    <div className="mx-auto max-w-[852px] pt-5">
      <div className="flex flex-col items-center text-center">
        <EmployeeAvatar src={profile.avatar} initials={initials} className="size-[120px] text-[40px]" />
        <h1 className="mt-7 text-2xl font-medium wrap-anywhere">{name}</h1>
        <p className="mt-1 text-[#626262] wrap-anywhere">{email}</p>
        <p className="mt-1">
          {hasMembershipDate ? (
            <>A member since <time dateTime={memberSince.toISOString()}>{membershipDateFormat.format(memberSince)}</time></>
          ) : "Member since date unavailable"}
        </p>
      </div>
      <dl className="mt-12 grid gap-x-8 gap-y-5 @md:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="px-4 text-xs text-[#626262]">{label}</dt>
            <dd className="flex min-h-12 items-center border border-[#aaa] px-3 py-2 wrap-anywhere">
              {value || <span className="text-[#626262]">—<span className="sr-only">Not provided</span></span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

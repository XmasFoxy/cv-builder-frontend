import { Avatar } from "@base-ui/react/avatar";
import type { EmployeesResult } from "./employees-data";

const columns = ["Avatar", "First Name", "Last Name", "Email", "Department", "Position"];

export function EmployeesTable({ result }: { result?: EmployeesResult }) {
  const items = result?.items;

  return (
    <div
      role="region"
      aria-label="Employees table"
      tabIndex={0}
      className="mt-4 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#626262]"
    >
      <table aria-label="Employees" className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#aaa]">
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-semibold first:w-20">
                {column === "Avatar" ? <span className="sr-only">Avatar</span> : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items?.map(({ id, email, profile, department, position }) => {
            const name = profile.first_name?.trim() || profile.last_name?.trim() || email;
            const [initial] = name;

            return (
              <tr key={id} className="h-[72px] border-b border-[#aaa]">
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 wrap-anywhere">{profile.first_name}</td>
                <td className="px-4 py-3 wrap-anywhere">{profile.last_name}</td>
                <td className="px-4 py-3 wrap-anywhere">{email}</td>
                <td className="px-4 py-3 wrap-anywhere">{department?.name}</td>
                <td className="px-4 py-3 wrap-anywhere">{position?.name}</td>
              </tr>
            );
          })}
          {!items?.length && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-[#626262]">
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
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

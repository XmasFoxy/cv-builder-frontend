import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RetryButton } from "@/components/layout/retry-button";
import { readViewer } from "@/lib/current-employee";
import { isRejected, readAccessToken, redirectForSession } from "@/lib/session";
import { employeeProfileHref, isEmployeeId, readEmployeesQuery } from "../employees/employees-url";

async function CurrentProfile() {
  const token = await readAccessToken("/profile");
  let viewer;
  try {
    viewer = await readViewer(token);
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession("/profile");
  }
  if (viewer && isEmployeeId(viewer.id)) redirect(employeeProfileHref(viewer.id, readEmployeesQuery({})));

  return <section><p role="alert">Failed to open your profile</p><RetryButton /></section>;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p role="status">Loading profile…</p>}>
      <CurrentProfile />
    </Suspense>
  );
}

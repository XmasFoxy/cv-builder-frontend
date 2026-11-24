import type { Metadata } from "next";

import { EmployeeDetailsPage, type EmployeeDetailsRouteProps } from "./employee-details-page";
import { getEmployeeProfile } from "./employee-profile-data";
import { EmployeeProfileDetails } from "./employee-profile";

export const metadata: Metadata = { title: "Employee profile | CV Builder" };

export default function EmployeeProfilePage(props: EmployeeDetailsRouteProps) {
  return (
    <EmployeeDetailsPage
      {...props}
      tab="profile"
      load={getEmployeeProfile}
      renderDetails={({ user, options }, name) => <EmployeeProfileDetails employee={user} name={name} options={options} />}
    />
  );
}

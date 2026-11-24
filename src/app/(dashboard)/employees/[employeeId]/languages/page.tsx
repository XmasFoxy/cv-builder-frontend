import type { Metadata } from "next";

import { EmployeeDetailsPage, type EmployeeDetailsRouteProps } from "../employee-details-page";
import { getEmployeeLanguages } from "../employee-profile-data";
import { EmployeeLanguages } from "../employee-qualifications";

export const metadata: Metadata = { title: "Employee languages | CV Builder" };

export default function EmployeeLanguagesPage(props: EmployeeDetailsRouteProps) {
  return (
    <EmployeeDetailsPage
      {...props}
      tab="languages"
      load={getEmployeeLanguages}
      renderDetails={({ user }, name) => <EmployeeLanguages languages={user.profile.languages} name={name} />}
    />
  );
}

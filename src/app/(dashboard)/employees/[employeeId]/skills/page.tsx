import type { Metadata } from "next";

import { EmployeeDetailsPage, type EmployeeDetailsRouteProps } from "../employee-details-page";
import { getEmployeeSkills } from "../employee-profile-data";
import { EmployeeSkills } from "../employee-qualifications";

export const metadata: Metadata = { title: "Employee skills | CV Builder" };

export default function EmployeeSkillsPage(props: EmployeeDetailsRouteProps) {
  return (
    <EmployeeDetailsPage
      {...props}
      tab="skills"
      load={getEmployeeSkills}
      renderDetails={({ user, skillCategories }, name) => (
        <EmployeeSkills skills={user.profile.skills} categories={skillCategories} name={name} />
      )}
    />
  );
}

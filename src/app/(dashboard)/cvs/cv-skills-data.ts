import { gql } from "@apollo/client";

import type { Viewer } from "@/lib/current-employee";

import type { EmployeeSkill, SkillCategory } from "../employees/[employeeId]/employee-profile-data";
import { queryOwnedCv } from "./cv-details-data";
import { cvSkillsHref, type CvsQuery } from "./cvs-url";

const CV_SKILLS = gql`
  query EmployeeCvSkills($id: ID!) {
    cv(cvId: $id) {
      id
      name
      skills { name categoryId mastery }
      user {
        id
        profile { skills { name categoryId mastery } }
      }
    }
    me { id role }
    skillCategories { id name order }
  }
`;

type CvSkillsResponse = {
  cv: {
    id: string;
    name: string;
    skills: EmployeeSkill[];
    user: { id: string; profile: { skills: EmployeeSkill[] } } | null;
  };
  me: Viewer;
  skillCategories: SkillCategory[];
};

export async function getCvSkills(id: string, query: CvsQuery) {
  const data = await queryOwnedCv<CvSkillsResponse>(id, cvSkillsHref(id, query), CV_SKILLS);
  if (!data?.cv.user) return null;
  return {
    id: data.cv.id,
    name: data.cv.name,
    skills: data.cv.skills,
    ownerSkills: data.cv.user.profile.skills,
    categories: data.skillCategories,
  };
}

import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { DocumentNode } from "graphql";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

import type { Employee } from "../employees-data";
import {
  employeeProfileHref, isEmployeeId, type EmployeeProfileTab, type EmployeesQuery,
} from "../employees-url";

export type EmployeeProfile = Employee & { created_at: string };

export type EmployeeIdentity = {
  email: string;
  profile: Pick<Employee["profile"], "first_name" | "last_name">;
};

export type EmployeeSkill = {
  name: string;
  categoryId: string | null;
  mastery: "Novice" | "Advanced" | "Competent" | "Proficient" | "Expert";
};

export type SkillCategory = { id: string; name: string; order: number };

export type EmployeeLanguage = {
  name: string;
  proficiency: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native";
};

const EMPLOYEE_PROFILE_QUERY = gql`
  query EmployeeProfile($userId: ID!) {
    user(userId: $userId) {
      id
      email
      created_at
      profile {
        avatar
        first_name
        last_name
      }
      department {
        name
      }
      position {
        name
      }
    }
  }
`;

const EMPLOYEE_SKILLS_QUERY = gql`
  query EmployeeSkills($userId: ID!) {
    user(userId: $userId) {
      id
      email
      profile {
        first_name
        last_name
        skills {
          name
          categoryId
          mastery
        }
      }
    }
    skillCategories {
      id
      name
      order
    }
  }
`;

const EMPLOYEE_LANGUAGES_QUERY = gql`
  query EmployeeLanguages($userId: ID!) {
    user(userId: $userId) {
      id
      email
      profile {
        first_name
        last_name
        languages {
          name
          proficiency
        }
      }
    }
  }
`;

type EmployeeSkillsData = {
  user: EmployeeIdentity & { profile: { skills: EmployeeSkill[] } };
  skillCategories: SkillCategory[];
};

type EmployeeLanguagesData = {
  user: EmployeeIdentity & { profile: { languages: EmployeeLanguage[] } };
};

export type EmployeeDetailsResult<Data> =
  | { status: "found"; data: Data }
  | { status: "missing" }
  | { status: "unavailable" };

export function getEmployeeProfile(id: string, query: EmployeesQuery) {
  return getEmployeeDetails<{ user: EmployeeProfile }>(id, query, "profile", EMPLOYEE_PROFILE_QUERY);
}

export function getEmployeeSkills(id: string, query: EmployeesQuery) {
  return getEmployeeDetails<EmployeeSkillsData>(id, query, "skills", EMPLOYEE_SKILLS_QUERY);
}

export function getEmployeeLanguages(id: string, query: EmployeesQuery) {
  return getEmployeeDetails<EmployeeLanguagesData>(id, query, "languages", EMPLOYEE_LANGUAGES_QUERY);
}

async function getEmployeeDetails<Data extends { user: EmployeeIdentity }>(
  id: string,
  query: EmployeesQuery,
  tab: EmployeeProfileTab,
  document: DocumentNode,
): Promise<EmployeeDetailsResult<Data>> {
  const destination = employeeProfileHref(id, query, tab);
  const token = await readAccessToken(destination);
  if (!isEmployeeId(id)) return { status: "missing" };

  try {
    const { data } = await createApolloClient().query<Data>({
      query: document,
      variables: { userId: id },
      ...authenticatedRequest(token),
    });
    if (data?.user) return { status: "found", data };
  } catch (error) {
    if (CombinedGraphQLErrors.is(error)) {
      if (error.errors.some(({ message }) => message === "unauthorized")) {
        return redirectForSession(destination);
      }
      if (error.errors.some(({ message }) => message === "userNotFound")) {
        return { status: "missing" };
      }
    }
  }

  return { status: "unavailable" };
}

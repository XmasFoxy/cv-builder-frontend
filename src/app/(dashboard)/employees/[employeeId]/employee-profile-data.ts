import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { DocumentNode } from "graphql";

import { createApolloClient } from "@/lib/apollo-client";
import type { Viewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, readAccessToken, redirectForSession } from "@/lib/session";

import type { Employee } from "../employees-data";
import {
  employeeProfileHref, isEmployeeId, type EmployeeProfileTab, type EmployeesQuery,
} from "../employees-url";
import type { Mastery, Proficiency } from "./qualification-levels";

type ProfileOption = { id: string; name: string };
export type ProfileOptions = { departments: ProfileOption[]; positions: ProfileOption[] };

export type EmployeeProfile = Employee & {
  created_at: string;
  department: { id?: string; name: string } | null;
  position: { id?: string; name: string } | null;
};

export type EmployeeIdentity = {
  email: string;
  profile: Pick<Employee["profile"], "first_name" | "last_name">;
};

export type EmployeeSkill = {
  name: string;
  categoryId: string | null;
  mastery: Mastery;
};

export type SkillCategory = { id: string; name: string; order: number };

export type EmployeeLanguage = {
  name: string;
  proficiency: Proficiency;
};

type CatalogOption = { id: string; name: string };
export type SkillOption = CatalogOption & { category: { id: string } };
type QualificationDetails<T> = { me?: Viewer; catalog?: T[] | null };

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
        id
        name
      }
      position {
        id
        name
      }
    }
    me { id role }
  }
`;

const PROFILE_OPTIONS_QUERY = gql`
  query EmployeeProfileOptions($page: Int!) {
    departments(params: { page: $page, limit: 100, sort_by: "name" }) {
      items { id name }
      total_pages
    }
    positions(params: { page: $page, limit: 100, sort_by: "name" }) {
      items { id name }
      total_pages
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
    me { id role }
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
    me { id role }
  }
`;

const SKILL_CATALOG = gql`
  query ProfileSkillCatalog($page: Int!) {
    catalog: skills(params: { page: $page, limit: 100, sort_by: "id" }) {
      items { id name category { id } }
      total_pages
    }
  }
`;

const LANGUAGE_CATALOG = gql`
  query ProfileLanguageCatalog($page: Int!) {
    catalog: languages(params: { page: $page, limit: 100, sort_by: "id" }) {
      items { id name }
      total_pages
    }
  }
`;

type EmployeeSkillsData = {
  user: EmployeeIdentity & { id?: string; profile: { skills: EmployeeSkill[] } };
  skillCategories: SkillCategory[];
} & QualificationDetails<SkillOption>;

type EmployeeLanguagesData = {
  user: EmployeeIdentity & { id?: string; profile: { languages: EmployeeLanguage[] } };
} & QualificationDetails<CatalogOption>;

export type EmployeeDetailsResult<Data> =
  | { status: "found"; data: Data }
  | { status: "missing" }
  | { status: "unavailable" };

type ProfileData = { user: EmployeeProfile; me?: Viewer; options?: ProfileOptions | null };

export async function getEmployeeProfile(id: string, query: EmployeesQuery): Promise<EmployeeDetailsResult<ProfileData>> {
  const result = await getEmployeeDetails<ProfileData>(id, query, "profile", EMPLOYEE_PROFILE_QUERY);
  if (result.status !== "found") return result;
  const { me, user } = result.data;
  if (me?.role !== "Employee" || me.id !== user.id) return result;
  const options = await getProfileOptions(employeeProfileHref(id, query));
  return { status: "found", data: { ...result.data, options } };
}

async function getProfileOptions(destination: ReturnType<typeof employeeProfileHref>) {
  const token = await readAccessToken(destination);
  const client = createApolloClient();
  const options: ProfileOptions = { departments: [], positions: [] };
  type Page = { items: ProfileOption[]; total_pages: number };

  try {
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const { data } = await client.query<{ departments: Page; positions: Page }>({
        query: PROFILE_OPTIONS_QUERY,
        variables: { page },
        ...authenticatedRequest(token),
      });
      if (!data) return null;
      options.departments.push(...data.departments.items);
      options.positions.push(...data.positions.items);
      totalPages = Math.max(data.departments.total_pages, data.positions.total_pages);
    }
    return options;
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
    return null;
  }
}

export async function getEmployeeSkills(id: string, query: EmployeesQuery) {
  const result = await getEmployeeDetails<EmployeeSkillsData>(id, query, "skills", EMPLOYEE_SKILLS_QUERY);
  if (result.status !== "found" || !ownsQualifications(result.data)) return result;
  const catalog = await getQualificationCatalog<SkillOption>(id, query, "skills", SKILL_CATALOG);
  return { ...result, data: { ...result.data, catalog } };
}

export async function getEmployeeLanguages(id: string, query: EmployeesQuery) {
  const result = await getEmployeeDetails<EmployeeLanguagesData>(id, query, "languages", EMPLOYEE_LANGUAGES_QUERY);
  if (result.status !== "found" || !ownsQualifications(result.data)) return result;
  const catalog = await getQualificationCatalog<CatalogOption>(id, query, "languages", LANGUAGE_CATALOG);
  return { ...result, data: { ...result.data, catalog } };
}

function ownsQualifications({ me, user }: { me?: Viewer; user: { id?: string } }) {
  return me?.role === "Employee" && me.id === user.id;
}

async function getQualificationCatalog<Option extends CatalogOption>(
  id: string, query: EmployeesQuery, tab: "skills" | "languages", document: DocumentNode,
) {
  const destination = employeeProfileHref(id, query, tab);
  const token = await readAccessToken(destination);
  const client = createApolloClient();
  const options: Option[] = [];
  try {
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const { data } = await client.query<{ catalog: { items: Option[]; total_pages: number } }>({
        query: document, variables: { page }, ...authenticatedRequest(token),
      });
      if (!data) return null;
      options.push(...data.catalog.items);
      totalPages = data.catalog.total_pages;
    }
    return options.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
    return null;
  }
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

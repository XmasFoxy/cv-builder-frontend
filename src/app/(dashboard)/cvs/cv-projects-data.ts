import { gql } from "@apollo/client";

import { createApolloClient } from "@/lib/apollo-client";
import type { Viewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, readAccessToken, redirectForSession } from "@/lib/session";

import { queryOwnedCv } from "./cv-details-data";
import type { CatalogProject, CvProject, ProjectOptions } from "./cv-projects-model";
import type { CvDetailsDestination } from "./cvs-url";

const CATALOG_PROJECT = gql`
  fragment CvProjectsCatalogProject on Project {
    id name domain description environment start_date end_date
  }
`;

const CV_PROJECTS = gql`
  query EmployeeCvProjects($id: ID!) {
    cv(cvId: $id) {
      id
      name
      user { id }
      projects {
        id start_date end_date roles responsibilities
        project { ...CvProjectsCatalogProject }
      }
    }
    me { id role }
  }
  ${CATALOG_PROJECT}
`;

const PROJECT_OPTIONS = gql`
  query EmployeeCvProjectOptions($page: Int!) {
    projects(params: { page: $page, limit: 100, sort_by: "id" }) {
      items { ...CvProjectsCatalogProject }
      total_pages
    }
    positions(params: { page: $page, limit: 100, sort_by: "id" }) {
      items { name }
      total_pages
    }
  }
  ${CATALOG_PROJECT}
`;

type CvProjectsResponse = {
  cv: { id: string; name: string; user: { id: string } | null; projects: CvProject[] | null };
  me: Viewer;
};

export async function getCvProjects(id: string, destination: CvDetailsDestination) {
  const data = await queryOwnedCv<CvProjectsResponse>(id, destination, CV_PROJECTS);
  if (!data) return null;
  return { id: data.cv.id, name: data.cv.name, projects: data.cv.projects ?? [] };
}

type CatalogPage<Item> = { items: Item[]; total_pages: number };

export async function getCvProjectOptions(destination: CvDetailsDestination): Promise<ProjectOptions | null> {
  const token = await readAccessToken(destination);
  const client = createApolloClient();
  const projects: CatalogProject[] = [];
  const roles = new Set<string>();

  try {
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const { data } = await client.query<{
        projects: CatalogPage<CatalogProject>;
        positions: CatalogPage<{ name: string }>;
      }>({ query: PROJECT_OPTIONS, variables: { page }, ...authenticatedRequest(token) });
      if (!data) return null;
      projects.push(...data.projects.items);
      for (const { name } of data.positions.items) if (name.trim()) roles.add(name);
      totalPages = Math.max(data.projects.total_pages, data.positions.total_pages);
    }
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
    return null;
  }

  return {
    projects: projects.sort((a, b) => a.name.localeCompare(b.name, "en")),
    roles: [...roles].sort((a, b) => a.localeCompare(b, "en")),
  };
}

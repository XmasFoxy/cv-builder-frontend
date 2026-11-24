import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { notFound } from "next/navigation";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

import { cvsHref, type CvsQuery } from "./cvs-url";

const CV_PAGE_SIZE = 10;

export type CvSummary = {
  id: string;
  name: string;
  education: string | null;
  description: string;
  user: { email: string } | null;
};

export type CvsResult = {
  items: CvSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

const EMPLOYEE_CVS_QUERY = gql`
  query EmployeeCvs($params: SearchPaginationInput!) {
    cvs(params: $params) {
      items {
        id
        name
        education
        description
        user {
          email
        }
      }
      total
      page
      limit
      total_pages
    }
  }
`;

function readRole(token: string): unknown {
  const [, payload] = token.split(".");
  if (!payload) return;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))?.role;
  } catch {
    return undefined;
  }
}

export async function getCvs(query: CvsQuery): Promise<CvsResult | null> {
  const destination = cvsHref(query);
  const token = await readAccessToken(destination);
  const role = readRole(token);
  if (!role) return redirectForSession(destination);

  // This check limits the UI to Employee. The API verifies the token and scopes its results.
  if (role !== "Employee") notFound();

  try {
    const { data } = await createApolloClient().query<{ cvs: CvsResult }>({
      query: EMPLOYEE_CVS_QUERY,
      variables: {
        params: {
          search: query.search || undefined,
          page: query.page,
          limit: CV_PAGE_SIZE,
          sort_by: "name",
          sort_order: query.sortOrder,
        },
      },
      ...authenticatedRequest(token),
    });
    return data?.cvs ?? null;
  } catch (error) {
    if (CombinedGraphQLErrors.is(error) && error.errors.some(({ message }) => message === "unauthorized")) {
      return redirectForSession(destination);
    }
    return null;
  }
}

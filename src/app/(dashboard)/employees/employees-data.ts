import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

import { employeesHref, type EmployeesQuery } from "./employees-url";

const EMPLOYEES_LIMIT = 10;

export type Employee = {
  id: string;
  email: string;
  profile: {
    avatar: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  department: { name: string } | null;
  position: { name: string } | null;
};

export type EmployeesResult = {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

const EMPLOYEES_QUERY = gql`
  query Employees($params: SearchPaginationInput!) {
    users(params: $params) {
      items {
        id
        email
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
      total
      page
      limit
      total_pages
    }
  }
`;

export async function getEmployees({ search, page, sort }: EmployeesQuery) {
  const destination = employeesHref({ search, page, sort });
  const token = await readAccessToken(destination);

  try {
    const { data } = await createApolloClient().query<{ users: EmployeesResult }>({
      query: EMPLOYEES_QUERY,
      variables: { params: { search: search || undefined, page, limit: EMPLOYEES_LIMIT, ...sort } },
      ...authenticatedRequest(token),
    });
    if (data?.users) return data.users;
  } catch (error) {
    if (CombinedGraphQLErrors.is(error) && error.errors.some(({ message }) => message === "unauthorized")) {
      return redirectForSession(destination);
    }
    throw new Error("Could not load employees", { cause: error });
  }

  throw new Error("The employees query returned no data");
}

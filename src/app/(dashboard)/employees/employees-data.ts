import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

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
};

const EMPLOYEES_QUERY = gql`
  query Employees {
    users {
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
    }
  }
`;

export async function getEmployees() {
  const token = await readAccessToken("/employees");

  try {
    const { data } = await createApolloClient().query<{ users: EmployeesResult }>({
      query: EMPLOYEES_QUERY,
      ...authenticatedRequest(token),
    });
    if (data?.users) return data.users;
  } catch (error) {
    if (CombinedGraphQLErrors.is(error) && error.errors.some(({ message }) => message === "unauthorized")) {
      return redirectForSession("/employees");
    }
    throw new Error("Could not load employees", { cause: error });
  }

  throw new Error("The employees query returned no data");
}

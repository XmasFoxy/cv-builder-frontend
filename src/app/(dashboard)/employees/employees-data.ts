import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

type EmployeesResponse = {
  users: {
    items: { id: string; email: string }[];
    total: number;
  };
};

const EMPLOYEES_QUERY = gql`
  query Employees {
    users {
      items {
        id
        email
      }
      total
    }
  }
`;

export async function getEmployees() {
  const token = await readAccessToken("/employees");

  try {
    const { data } = await createApolloClient().query<EmployeesResponse>({
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

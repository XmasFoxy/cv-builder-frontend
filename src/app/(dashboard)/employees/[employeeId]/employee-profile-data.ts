import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, readAccessToken, redirectForSession } from "@/lib/session";

import type { Employee } from "../employees-data";
import { employeeProfileHref, isEmployeeId, type EmployeesQuery } from "../employees-url";

export type EmployeeProfile = Employee & { created_at: string };

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

type ProfileResult =
  | { status: "found"; employee: EmployeeProfile }
  | { status: "missing" }
  | { status: "unavailable" };

export async function getEmployeeProfile(id: string, query: EmployeesQuery): Promise<ProfileResult> {
  const destination = employeeProfileHref(id, query);
  const token = await readAccessToken(destination);
  if (!isEmployeeId(id)) return { status: "missing" };

  try {
    const { data } = await createApolloClient().query<{ user: EmployeeProfile }>({
      query: EMPLOYEE_PROFILE_QUERY,
      variables: { userId: id },
      ...authenticatedRequest(token),
    });
    if (data?.user) return { status: "found", employee: data.user };
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

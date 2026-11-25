import { gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { CvDetailsDestination, CvsDestination } from "@/app/(dashboard)/cvs/cvs-url";
import type { EmployeeProfileDestination } from "@/app/(dashboard)/employees/employees-url";
import { createApolloClient } from "@/lib/apollo-client";
import { accessCookie, refreshCookie, writeSession, type SessionTokens } from "@/lib/session-cookies";

// The backend has no session query. Its protected languages field runs the access guard.
const VERIFY_ACCESS = gql`
  query VerifyAccess {
    languages {
      __typename
    }
  }
`;

const UPDATE_TOKEN = gql`
  mutation UpdateToken {
    updateToken {
      access_token
      refresh_token
    }
  }
`;

export const dashboardPaths = ["/employees", "/skills", "/languages", "/cvs", "/profile"] as const;
type DashboardPath = (typeof dashboardPaths)[number];
type DashboardDestination = DashboardPath | `/employees?${string}` | EmployeeProfileDestination | CvsDestination | CvDetailsDestination;

export function authenticatedRequest(token: string) {
  return {
    fetchPolicy: "no-cache" as const,
    context: {
      headers: { authorization: `Bearer ${token}` },
      fetchOptions: { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) },
    },
  };
}

export function isRejected(error: unknown, message: string) {
  return CombinedGraphQLErrors.is(error) &&
    error.errors.some((item) => item.message === message);
}

export async function verifyAccess(token: string) {
  try {
    const { data } = await createApolloClient().query<{ languages: { __typename: string } }>({
      query: VERIFY_ACCESS,
      ...authenticatedRequest(token),
    });
    if (data?.languages?.__typename !== "PaginatedLanguages") {
      throw new Error("Missing access verification result");
    }
    return true;
  } catch (error) {
    if (isRejected(error, "unauthorized")) return false;
    throw new Error("The authentication service is temporarily unavailable");
  }
}

export async function refreshSession(token: string) {
  try {
    const { data } = await createApolloClient().mutate<{ updateToken: SessionTokens }>({
      mutation: UPDATE_TOKEN,
      ...authenticatedRequest(token),
    });
    const tokens = data?.updateToken;
    if (!tokens?.access_token || !tokens.refresh_token) {
      throw new Error("Missing session tokens");
    }
    return tokens;
  } catch (error) {
    if (isRejected(error, "invalidRefreshToken")) return null;
    throw new Error("The authentication service is temporarily unavailable");
  }
}

export async function requireSession(path: DashboardPath) {
  const access = await readAccessToken(path);
  if (await verifyAccess(access)) return;

  return redirectForSession(path);
}

export async function readAccessToken(path: DashboardDestination) {
  const access = (await cookies()).get(accessCookie)?.value;
  return access || redirectForSession(path);
}

export async function withMutationSession<Result>(submit: (token: string) => Promise<Result>) {
  const store = await cookies();
  const access = store.get(accessCookie)?.value;
  const result = access ? await submit(access) : "expired";
  if (result !== "expired") return result;

  // An authentication rejection happens before the mutation runs, so it is safe to retry once.
  const token = store.get(refreshCookie)?.value;
  if (!token) return "expired";
  try {
    const session = await refreshSession(token);
    if (!session) return "expired";
    writeSession(store, session);
    return await submit(session.access_token);
  } catch {
    return "unavailable";
  }
}

export async function redirectForSession(path: DashboardDestination): Promise<never> {
  const store = await cookies();
  if (store.get(refreshCookie)?.value) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`);
  }

  redirect("/login");
}

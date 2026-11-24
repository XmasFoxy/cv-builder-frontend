"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";
import { cookies } from "next/headers";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, isRejected, refreshSession } from "@/lib/session";
import { accessCookie, refreshCookie, writeSession } from "@/lib/session-cookies";

import { createCvSchema, type CreateCvFields } from "./create-cv-schema";
import { readCvAccessClaims } from "./cvs-session";

const CREATE_CV = gql`
  mutation CreateEmployeeCv($cv: CreateCvInput!) {
    createCv(cv: $cv) {
      id
    }
  }
`;

type SubmitStatus = "created" | "expired" | "forbidden" | "unavailable";
export type CreateCvStatus = SubmitStatus | "invalid";

async function submitCv(fields: CreateCvFields, token: string): Promise<SubmitStatus> {
  const claims = readCvAccessClaims(token);
  if (!claims?.userId || !claims.role) return "expired";
  if (claims.role !== "Employee") return "forbidden";

  const { userId } = claims;
  try {
    const { data } = await createApolloClient().mutate<{ createCv: { id: string } }>({
      mutation: CREATE_CV,
      // Keep compatibility with instances where the mutation still expects the owner in its input.
      variables: { cv: { ...fields, userId } },
      ...authenticatedRequest(token),
    });
    return data?.createCv?.id ? "created" : "unavailable";
  } catch (error) {
    return isRejected(error, "unauthorized") ? "expired" : "unavailable";
  }
}

export async function createEmployeeCv(values: CreateCvFields): Promise<CreateCvStatus> {
  const fields = createCvSchema.safeParse(values);
  if (!fields.success) return "invalid";

  const store = await cookies();
  const access = store.get(accessCookie)?.value;
  let result = access ? await submitCv(fields.data, access) : "expired";

  // Only retry after an authentication rejection, before the resolver could have created a CV.
  if (result === "expired") {
    const refreshToken = store.get(refreshCookie)?.value;
    if (!refreshToken) return result;

    try {
      const session = await refreshSession(refreshToken);
      if (!session) return result;

      writeSession(store, session);
      result = await submitCv(fields.data, session.access_token);
    } catch {
      return "unavailable";
    }
  }

  if (result === "created") refresh();
  return result;
}

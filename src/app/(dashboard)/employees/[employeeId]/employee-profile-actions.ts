"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { createApolloClient } from "@/lib/apollo-client";
import { readViewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, refreshSession } from "@/lib/session";
import { accessCookie, refreshCookie, writeSession } from "@/lib/session-cookies";
import { isEmployeeId } from "../employees-url";
import { employeeProfileSchema, type EmployeeProfileFields } from "./employee-profile-schema";

const UPDATE_PROFILE = gql`
  mutation UpdateEmployeeProfile($profile: UpdateProfileInput!) {
    updateProfile(profile: $profile) { id }
  }
`;

async function saveWithToken(userId: string, fields: EmployeeProfileFields, token: string) {
  try {
    const viewer = await readViewer(token);
    if (viewer?.role !== "Employee" || viewer.id !== userId) return "forbidden";
    const { data } = await createApolloClient().mutate<{ updateProfile: { id: string } }>({
      mutation: UPDATE_PROFILE,
      variables: { profile: { ...fields, userId } },
      ...authenticatedRequest(token),
    });
    return data?.updateProfile?.id === userId ? "updated" : "unavailable";
  } catch (error) {
    return isRejected(error, "unauthorized") ? "expired" : "unavailable";
  }
}

export async function saveEmployeeProfile(userId: string, values: EmployeeProfileFields) {
  const fields = employeeProfileSchema.safeParse(values);
  if (!isEmployeeId(userId) || !fields.success) return "invalid";

  const store = await cookies();
  const access = store.get(accessCookie)?.value;
  let result = access ? await saveWithToken(userId, fields.data, access) : "expired";
  if (result === "expired") {
    const token = store.get(refreshCookie)?.value;
    if (!token) return result;
    try {
      const session = await refreshSession(token);
      if (!session) return result;
      writeSession(store, session);
      result = await saveWithToken(userId, fields.data, session.access_token);
    } catch {
      return "unavailable";
    }
  }
  if (result === "updated") refresh();
  return result;
}

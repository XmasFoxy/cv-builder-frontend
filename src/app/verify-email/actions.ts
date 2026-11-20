"use server";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { cookies } from "next/headers";

import { VERIFY_MAIL_MUTATION } from "@/graphql/auth";
import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, refreshSession } from "@/lib/session";
import { accessCookie, refreshCookie, writeSession } from "@/lib/session-cookies";

type VerificationResult = "success" | "invalid" | "expired" | "sign-in" | "unavailable";

async function confirmWithToken(otp: string, token: string): Promise<VerificationResult> {
  try {
    const { data } = await createApolloClient().mutate<{ verifyMail: null }, { mail: { otp: string } }>({
      mutation: VERIFY_MAIL_MUTATION,
      variables: { mail: { otp } },
      ...authenticatedRequest(token),
    });
    return data?.verifyMail === null ? "success" : "unavailable";
  } catch (error) {
    if (CombinedGraphQLErrors.is(error)) {
      const messages = error.errors.map(({ message }) => message);
      if (messages.includes("unauthorized")) return "sign-in";
      if (messages.includes("otpExpired")) return "expired";
      if (messages.includes("mailNotFound")) return "invalid";
    }
    return "unavailable";
  }
}

export async function verifyEmail(otp: string): Promise<VerificationResult> {
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) return "invalid";

  try {
    const store = await cookies();
    const access = store.get(accessCookie)?.value;
    if (access) {
      const result = await confirmWithToken(otp, access);
      if (result !== "sign-in") return result;
    }

    const refresh = store.get(refreshCookie)?.value;
    if (!refresh) return "sign-in";

    const tokens = await refreshSession(refresh);
    if (!tokens) return "sign-in";

    writeSession(store, tokens);
    return await confirmWithToken(otp, tokens.access_token);
  } catch {
    return "unavailable";
  }
}

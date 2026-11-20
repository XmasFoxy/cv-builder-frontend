"use server";

import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { RESET_PASSWORD_MUTATION, type ResetPasswordResponse, type ResetPasswordVariables } from "@/graphql/auth";
import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest } from "@/lib/session";
import {
  loginSchema,
  resetPasswordSchema,
  type LoginFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { signIn } from "../login/actions";

type ResetResult = "signed-in" | "updated" | "expired" | "unavailable";

export async function resetPassword(token: string, values: ResetPasswordFormValues): Promise<ResetResult> {
  const input = resetPasswordSchema.safeParse(values);
  if (!input.success) return "unavailable";
  if (typeof token !== "string" || token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    return "expired";
  }

  let credentials: LoginFormValues;
  try {
    const claims: unknown = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    if (!claims || typeof claims !== "object" || !("jti" in claims) ||
        typeof claims.jti !== "string" || !claims.jti || !("email" in claims)) {
      return "expired";
    }
    const candidate = loginSchema.safeParse({ email: claims.email, password: input.data.newPassword });
    if (!candidate.success) return "expired";
    credentials = candidate.data;
  } catch {
    return "expired";
  }

  try {
    // The API verifies the reset token. The decoded email is only a hint for the subsequent login.
    const { data } = await createApolloClient().mutate<ResetPasswordResponse, ResetPasswordVariables>({
      mutation: RESET_PASSWORD_MUTATION,
      variables: { auth: input.data },
      ...authenticatedRequest(token),
    });
    if (data?.resetPassword !== null) return "unavailable";
  } catch (error) {
    if (CombinedGraphQLErrors.is(error) && error.errors.some(({ message }) => message === "actionExpired")) {
      return "expired";
    }
    return "unavailable";
  }

  const result = await signIn(credentials).catch(() => "unavailable" as const);
  return result === "success" ? "signed-in" : "updated";
}

"use server";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { cookies } from "next/headers";

import {
  LOGIN_MUTATION,
  type LoginResponse,
  type LoginVariables,
} from "@/graphql/auth";
import { createApolloClient } from "@/lib/apollo-client";
import { writeSession } from "@/lib/session-cookies";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

type SignInResult = "success" | "invalid-credentials" | "unavailable";

export async function signIn(values: LoginFormValues): Promise<SignInResult> {
  const credentials = loginSchema.safeParse(values);

  if (!credentials.success) {
    return "invalid-credentials";
  }

  try {
    const { data } = await createApolloClient().mutate<LoginResponse, LoginVariables>({
      mutation: LOGIN_MUTATION,
      variables: { auth: credentials.data },
      fetchPolicy: "no-cache",
      context: { fetchOptions: { cache: "no-store", redirect: "error" } },
    });
    const session = data?.login;

    if (!session?.access_token || !session.refresh_token) {
      return "unavailable";
    }

    writeSession(await cookies(), session);

    return "success";
  } catch (error) {
    if (
      CombinedGraphQLErrors.is(error) &&
      error.errors.some(({ message }) => message === "invalidCredentials")
    ) {
      return "invalid-credentials";
    }

    return "unavailable";
  }
}

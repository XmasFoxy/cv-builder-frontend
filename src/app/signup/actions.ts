"use server";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { cookies, headers } from "next/headers";

import { SIGNUP_MUTATION, type SignupResponse, type SignupVariables } from "@/graphql/auth";
import { createApolloClient } from "@/lib/apollo-client";
import { writeSession } from "@/lib/session-cookies";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";

type SignupResult = "success" | "duplicate" | "unavailable";

export async function registerAccount(values: SignupFormValues): Promise<SignupResult> {
  const input = signupSchema.safeParse(values);
  if (!input.success) return "unavailable";

  try {
    const origin = (await headers()).get("origin");
    if (!origin) return "unavailable";

    const { data } = await createApolloClient().mutate<SignupResponse, SignupVariables>({
      mutation: SIGNUP_MUTATION,
      variables: { auth: input.data },
      fetchPolicy: "no-cache",
      context: {
        headers: { origin },
        fetchOptions: { cache: "no-store", redirect: "error" },
      },
    });
    const session = data?.signup;
    if (!session?.access_token || !session.refresh_token) return "unavailable";

    writeSession(await cookies(), session);
    return "success";
  } catch (error) {
    if (CombinedGraphQLErrors.is(error) && error.errors.some(({ message }) => message === "userAlreadyExists")) {
      return "duplicate";
    }
    return "unavailable";
  }
}

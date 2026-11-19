"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";

import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/validations/auth";

import {
  SIGNUP_MUTATION,
  type SignupResponse,
  type SignupVariables,
} from "@/graphql/auth";

export default function SignupPage() {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [signup, { loading }] = useMutation<
    SignupResponse,
    SignupVariables
  >(SIGNUP_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError("");
    setSuccessMessage("");

    try {
      const result = await signup({
        variables: {
          auth: {
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          },
        },
      });

      if (!result.data?.signup) {
        setServerError("Registration failed. Please try again.");
        return;
      }

      setSuccessMessage(
        "Account created successfully. You can now sign in.",
      );
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    }
  }

  return (
    <AuthLayout
      currentPage="/signup"
      title="Sign up now"
      description="Welcome! Sign up to continue"
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email?.message}
      />

      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        registration={register("password")}
        error={errors.password?.message}
      />

      <AuthField
        id="confirm-password"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      {serverError && (
        <p role="alert" className="text-center text-sm text-[#cf3033]">
          {serverError}
        </p>
      )}

      {successMessage && (
        <p role="status" className="text-center text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <AuthActions
        disabled={loading}
        submitLabel={loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        linkHref="/login"
        linkLabel="I HAVE AN ACCOUNT"
      />
    </AuthLayout>
  );
}

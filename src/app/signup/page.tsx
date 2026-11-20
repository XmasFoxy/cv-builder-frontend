"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";

import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/validations/auth";

import { registerAccount } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
    const result = await registerAccount(values).catch(() => "unavailable" as const);
    if (result === "success") {
      router.replace("/verify-email");
      return;
    }
    const messages = {
      duplicate: "An account with this email already exists.",
      "email-not-sent": "Your account was created, but we couldn’t send the verification email. You can sign in with your new account.",
      unavailable: "Registration failed. Please try again.",
    };
    setServerError(messages[result]);
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

      <AuthActions
        disabled={isSubmitting}
        submitLabel={isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        linkHref="/login"
        linkLabel="I HAVE AN ACCOUNT"
      />
    </AuthLayout>
  );
}

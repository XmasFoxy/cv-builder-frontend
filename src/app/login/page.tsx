"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";

import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";
import { signIn } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isLoading },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const result = await signIn(values).catch(() => "unavailable" as const);

    if (result === "success") {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next === "/verify-email" ? next : "/employees");
      return;
    }

    setServerError(
      result === "invalid-credentials"
        ? "Invalid email or password"
        : "Something went wrong. Please try again later.",
    );
  }

  return (
    <AuthLayout
      currentPage="/login"
      title="Welcome back"
      description="Hello again! Sign in to continue"
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        registration={register("email", {
          onChange: () => setServerError(null),
        })}
        error={errors.email?.message}
        disabled={isLoading}
      />

      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register("password", {
          onChange: () => setServerError(null),
        })}
        error={errors.password?.message}
        disabled={isLoading}
      />

      {serverError && (
        <p role="alert" className="text-center text-sm text-[#cf3033]">
          {serverError}
        </p>
      )}

      <AuthActions
        disabled={isLoading}
        submitLabel={isLoading ? "SIGNING IN..." : "SIGN IN"}
        linkHref="/forgot-password"
        linkLabel="FORGOT PASSWORD"
      />
    </AuthLayout>
  );
}

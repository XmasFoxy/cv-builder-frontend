"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";

import {
  LOGIN_MUTATION,
  type LoginResponse,
  type LoginVariables,
} from "@/graphql/auth";

import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const [login, { loading }] = useMutation<
    LoginResponse,
    LoginVariables
  >(LOGIN_MUTATION);

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      const result = await login({
        variables: {
          auth: {
            email: values.email,
            password: values.password,
          },
        },
      });

      if (result.data?.login) {
        // Временно проверяем успешный ответ.
        // Сохранение токенов добавим на следующем этапе.
        console.log("Login successful:", result.data.login.user);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "";

      if (message.includes("invalidCredentials")) {
        setServerError("Invalid email or password");
      } else {
        setServerError(
          "Something went wrong. Please try again later.",
        );
      }
    }
  }

  const isLoading = loading || isSubmitting;

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

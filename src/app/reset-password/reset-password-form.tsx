"use client";

import { useState } from "react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";
import {
  RESET_PASSWORD_MUTATION,
  type ResetPasswordResponse,
  type ResetPasswordVariables,
} from "@/graphql/auth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";

function ResetMessage({
  description,
  href,
  action,
}: {
  description: string;
  href: string;
  action: string;
}) {
  return (
    <AuthLayout title="Reset password" description={description}>
      <div className="mt-10 text-center">
        <Link
          href={href}
          className="inline-flex h-11 cursor-pointer items-center rounded-full bg-[#cf3033] px-8 text-sm font-medium text-white transition-colors hover:bg-[#b9292c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf3033]"
        >
          {action}
        </Link>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParams()?.get("token");
  const [status, setStatus] = useState<"idle" | "complete" | "expired" | "error">("idle");
  const [resetPassword] = useMutation<ResetPasswordResponse, ResetPasswordVariables>(
    RESET_PASSWORD_MUTATION,
  );
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordFormValues>({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: { newPassword: "", confirmPassword: "" },
      mode: "onBlur",
    });

  if (!token || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) || status === "expired") {
    return (
      <ResetMessage
        description={status === "expired"
          ? "This password reset link has expired. Please request a new one."
          : "This password reset link is invalid. Please request a new one."}
        href="/forgot-password"
        action="REQUEST A NEW LINK"
      />
    );
  }

  if (status === "complete") {
    return (
      <ResetMessage
        description="Your password has been updated. Sign in with your new password."
        href="/login"
        action="GO TO SIGN IN"
      />
    );
  }

  async function onSubmit(auth: ResetPasswordFormValues) {
    setStatus("idle");
    try {
      await resetPassword({
        variables: { auth },
        context: {
          headers: { authorization: `Bearer ${token}` },
          fetchOptions: { redirect: "error", referrerPolicy: "no-referrer" },
        },
      });
      reset();
      setStatus("complete");
    } catch (error) {
      const expired = CombinedGraphQLErrors.is(error) &&
        error.errors.some(({ message }) => message === "actionExpired");
      setStatus(expired ? "expired" : "error");
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Here you should write a new password and confirm it."
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="off"
        registration={register("newPassword")}
        error={errors.newPassword?.message}
        disabled={isSubmitting}
      />
      <AuthField
        id="confirm-new-password"
        label="Confirm password"
        type="password"
        autoComplete="off"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        disabled={isSubmitting}
      />
      {status === "error" && (
        <p role="alert" className="text-center text-sm text-[#cf3033]">
          Something went wrong. Please try again later.
        </p>
      )}
      <AuthActions
        disabled={isSubmitting}
        submitLabel={isSubmitting ? "SAVING..." : "SUBMIT"}
        linkHref="/login"
        linkLabel="GO TO SIGN IN"
      />
    </AuthLayout>
  );
}

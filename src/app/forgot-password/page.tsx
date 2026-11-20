"use client";

import { useState } from "react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthField } from "@/components/auth/auth-field";
import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";
import {
  FORGOT_PASSWORD_MUTATION,
  type ForgotPasswordResponse,
  type ForgotPasswordVariables,
} from "@/graphql/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "complete" | "error">("idle");
  const [requestReset] = useMutation<ForgotPasswordResponse, ForgotPasswordVariables>(
    FORGOT_PASSWORD_MUTATION,
  );
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordFormValues>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: { email: "" },
      mode: "onBlur",
    });

  async function onSubmit(auth: ForgotPasswordFormValues) {
    setStatus("idle");
    try {
      await requestReset({ variables: { auth } });
      setStatus("complete");
    } catch (error) {
      // The backend uses this error for both an unknown email and a delivery failure.
      const undisclosed = CombinedGraphQLErrors.is(error) &&
        error.errors.some(({ message }) => message === "failedToSendEmail");
      setStatus(undisclosed ? "complete" : "error");
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      description="We will send you an email with further instructions."
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        id="recovery-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="example@email.com"
        visibleLabel
        registration={register("email", { onChange: () => setStatus("idle") })}
        error={errors.email?.message}
        disabled={isSubmitting}
      />

      {status === "complete" && (
        <p role="status" className="text-center text-sm">
          If an account exists for this email, you’ll receive password reset instructions.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-center text-sm text-[#cf3033]">
          Something went wrong. Please try again later.
        </p>
      )}

      <AuthActions
        disabled={isSubmitting}
        submitLabel={isSubmitting ? "SENDING..." : "RESET PASSWORD"}
        linkHref="/login"
        linkLabel="CANCEL"
      />
    </AuthLayout>
  );
}

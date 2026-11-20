import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | CV Builder",
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Reset password" description="Loading the password reset form.">
        {null}
      </AuthLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

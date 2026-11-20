import type { Metadata } from "next";

import { VerificationForm } from "./verification-form";

export const metadata: Metadata = { title: "Email verification | CV Builder" };

export default function VerifyEmailPage() {
  return <VerificationForm />;
}

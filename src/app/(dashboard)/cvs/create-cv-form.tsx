"use client";

import { useRouter } from "next/navigation";

import { createEmployeeCv, type CreateCvResult } from "./create-cv-action";
import { CvForm } from "./cv-form";
import { cvDetailsHref, cvsHref, type CvsQuery } from "./cvs-url";

const errorMessages: Record<Extract<CreateCvResult, string>, string> = {
  unavailable: "Failed to create CV. Please try again.",
  invalid: "Check the CV details and try again.",
  expired: "Your session has expired. Sign in to continue.",
  forbidden: "Creating a CV requires an Employee session.",
};

export function CreateCvForm({ query }: { query: CvsQuery }) {
  const router = useRouter();

  return <CvForm cancelHref={cvsHref(query)} onSave={async (fields) => {
    const result = await createEmployeeCv(fields);
    if (typeof result === "string") return errorMessages[result];
    router.replace(cvDetailsHref(result.id, query));
  }} />;
}

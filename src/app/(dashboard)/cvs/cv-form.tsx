"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCvSchema, type CreateCvFields } from "./create-cv-schema";
import type { CvsDestination } from "./cvs-url";
import { updateEmployeeCv } from "./manage-cv-actions";

const fields = [
  { name: "name", label: "Name" },
  { name: "education", label: "Education" },
  { name: "description", label: "Description" },
] as const;

export function EditableCvForm({ cv }: {
  cv: Omit<CreateCvFields, "education"> & { id: string; education: string | null };
}) {
  const { name, education, description } = cv;
  return <CvForm initial={{ name, education: education ?? "", description }}
    onSave={async (fields) => {
      const result = await updateEmployeeCv(cv.id, fields);
      if (result === "updated") return;
      if (result === "expired") return "Your session has expired. Sign in to continue.";
      if (result === "forbidden") return "This CV is no longer available to you.";
      return "Failed to update CV. Please try again.";
    }} />;
}

export function CvForm({ initial, cancelHref, onSave }: {
  initial?: CreateCvFields;
  cancelHref?: CvsDestination;
  onSave: (fields: CreateCvFields) => Promise<string | undefined>;
}) {
  const id = useId();
  const saving = useRef(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const { formState: { errors, isDirty, isValid, isSubmitting }, handleSubmit, register, reset } = useForm<CreateCvFields>({
    resolver: zodResolver(createCvSchema),
    defaultValues: initial ?? { name: "", education: "", description: "" },
    mode: "all",
  });
  const isEditing = Boolean(initial);

  async function submit(values: CreateCvFields) {
    if (saving.current || (isEditing && !isDirty)) return;
    saving.current = true;
    setMessage("");
    setSaved(false);
    try {
      const error = await onSave(values);
      if (error) setMessage(error);
      else {
        reset(isEditing ? values : undefined);
        setSaved(isEditing);
      }
    } catch {
      setMessage(`Failed to ${isEditing ? "update" : "create"} CV. Please try again.`);
    } finally {
      saving.current = false;
    }
  }

  const action = isEditing ? "Update" : "Create";
  const pendingAction = isEditing ? "Updating…" : "Creating…";

  return (
    <form onSubmit={(event) => void handleSubmit(submit)(event)} noValidate className="flex flex-col gap-4" aria-busy={isSubmitting}>
      {fields.map(({ name, label }) => {
        const fieldId = `${id}-${name}`;
        const error = errors[name]?.message;
        const Control = name === "description" ? Textarea : Input;
        const size = name === "description" ? "min-h-44 px-3 py-4 md:text-base" : "h-12 px-3 md:text-base";
        return (
          <div key={name} className="grid gap-1">
            <label htmlFor={fieldId} className="px-4 text-xs text-muted-foreground">{label}</label>
            <Control {...register(name)} id={fieldId} required readOnly={isSubmitting}
              aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined}
              className={`${size} rounded-none border-[var(--cvs-divider)]`} />
            {error && <p id={`${fieldId}-error`} className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {saved && <p role="status" className="text-sm">CV updated</p>}
        {cancelHref && (
          <Link href={cancelHref} prefetch={false} aria-disabled={isSubmitting}
            onClick={(event) => { if (isSubmitting) event.preventDefault(); }}
            onNavigate={() => { reset(); setMessage(""); }}
            className={cn(buttonVariants({ variant: "outline" }), "h-12 min-w-40 rounded-full uppercase aria-disabled:opacity-50")}>
            Cancel
          </Link>
        )}
        <Button type="submit" disabled={!isValid || isSubmitting || (isEditing && !isDirty)}
          className="h-12 min-w-40 rounded-full bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
          {isSubmitting ? pendingAction : action}
        </Button>
      </div>
    </form>
  );
}

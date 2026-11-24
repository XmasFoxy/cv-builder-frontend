"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCvSchema, type CreateCvFields } from "./create-cv-schema";
import { updateEmployeeCv } from "./manage-cv-actions";

const fields = [
  { name: "name", label: "Name" },
  { name: "education", label: "Education" },
  { name: "description", label: "Description" },
] as const;

export function EditableCvForm({ cv, action, onUpdated, onPendingChange }: {
  cv: Omit<CreateCvFields, "education"> & { id: string; education: string | null };
  action: "Save" | "Update";
  onUpdated?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { name, education, description } = cv;
  return <CvForm action={action} initial={{ name, education: education ?? "", description }} onPendingChange={onPendingChange}
    onSave={async (fields) => {
      const result = await updateEmployeeCv(cv.id, fields);
      if (result === "updated") {
        onUpdated?.();
        return;
      }
      if (result === "expired") return "Your session has expired. Sign in to continue.";
      if (result === "forbidden") return "This CV is no longer available to you.";
      return "Failed to update CV. Please try again.";
    }} />;
}

export function CvForm({ initial, action, onSave, onPendingChange }: {
  initial?: CreateCvFields;
  action: "Create" | "Save" | "Update";
  onSave: (fields: CreateCvFields) => Promise<string | undefined>;
  onPendingChange?: (pending: boolean) => void;
}) {
  const id = useId();
  const saving = useRef(false);
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const { formState: { errors, isDirty, isValid, isSubmitting }, handleSubmit, register, reset } = useForm<CreateCvFields>({
    resolver: zodResolver(createCvSchema),
    defaultValues: initial ?? { name: "", education: "", description: "" },
    mode: "all",
  });
  const details = action === "Update";

  async function submit(values: CreateCvFields) {
    if (saving.current || (details && !isDirty)) return;
    saving.current = true;
    onPendingChange?.(true);
    setMessage("");
    setUpdated(false);
    try {
      const error = await onSave(values);
      if (error) setMessage(error);
      else if (details) {
        reset(values);
        setUpdated(true);
      }
    } catch {
      setMessage(`Failed to ${action === "Create" ? "create" : "update"} CV. Please try again.`);
    } finally {
      saving.current = false;
      onPendingChange?.(false);
    }
  }

  const submitButton = (
    <Button type="submit" disabled={!isValid || isSubmitting || (details && !isDirty)}
      className={details
        ? "h-12 min-w-40 rounded-full bg-[#b51f24] text-white uppercase hover:bg-[#95191d]"
        : "bg-[#b51f24] text-white uppercase hover:bg-[#95191d]"}>
      {isSubmitting ? { Create: "Creating…", Save: "Saving…", Update: "Updating…" }[action] : action}
    </Button>
  );
  let footer: ReactNode;
  if (details) {
    footer = (
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {updated && <p role="status" className="text-sm">CV updated</p>}
        {submitButton}
      </div>
    );
  } else {
    footer = (
      <DialogFooter className="mt-1 flex-row justify-end">
        <DialogClose render={<Button variant="outline" disabled={isSubmitting} className="uppercase" />}>Cancel</DialogClose>
        {submitButton}
      </DialogFooter>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(submit)(event)} noValidate className="flex flex-col gap-4" aria-busy={isSubmitting}>
      {fields.map(({ name, label }) => {
        const fieldId = `${id}-${name}`;
        const error = errors[name]?.message;
        const Control = name === "description" ? Textarea : Input;
        const size = name === "description" ? (details ? "min-h-44 px-3 py-4 md:text-base" : "min-h-24") : "h-12 px-3 md:text-base";
        return (
          <div key={name} className="grid gap-1">
            <label htmlFor={fieldId} className={details ? "px-4 text-xs text-muted-foreground" : "font-medium"}>{label}</label>
            <Control {...register(name)} id={fieldId} required readOnly={isSubmitting}
              aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined}
              className={details ? `${size} rounded-none border-[var(--cvs-divider)]` : `${size} border-border`} />
            {error && <p id={`${fieldId}-error`} className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      {footer}
    </form>
  );
}

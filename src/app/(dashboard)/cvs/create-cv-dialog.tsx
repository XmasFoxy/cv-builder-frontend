"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createEmployeeCv, type CreateCvStatus } from "./create-cv-action";
import { createCvSchema, type CreateCvFields } from "./create-cv-schema";

const fields = [
  { name: "name", label: "Name" },
  { name: "education", label: "Education" },
  { name: "description", label: "Description" },
] as const;

const errorMessages: Record<Exclude<CreateCvStatus, "created">, string> = {
  unavailable: "Failed to create CV. Please try again.",
  invalid: "Check the CV details and try again.",
  expired: "Your session has expired. Sign in to continue.",
  forbidden: "Creating a CV requires an Employee session.",
};

export function CreateCvDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState(false);
  const portalContainer = useRef<HTMLDivElement>(null);
  const saving = useRef(false);
  const fieldPrefix = useId();
  const { formState: { errors, isValid, isSubmitting }, handleSubmit, register, reset } = useForm<CreateCvFields>({
    resolver: zodResolver(createCvSchema),
    defaultValues: { name: "", education: "", description: "" },
    mode: "all",
  });

  async function submit(values: CreateCvFields) {
    if (saving.current) return;
    saving.current = true;
    setMessage("");
    try {
      const status = await createEmployeeCv(values);
      if (status === "created") {
        setCreated(true);
        setOpen(false);
      } else {
        setMessage(errorMessages[status]);
      }
    } catch {
      setMessage(errorMessages.unavailable);
    } finally {
      saving.current = false;
    }
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      <span role="status" className="text-sm text-muted-foreground">{created && "CV created"}</span>
      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (saving.current) return;
        if (nextOpen) {
          setCreated(false);
          setMessage("");
          reset();
        }
        setOpen(nextOpen);
      }}>
        <DialogTrigger render={<Button variant="ghost" className="h-11 gap-2 px-4 text-destructive uppercase hover:text-destructive aria-expanded:text-destructive" />}>
          <Plus aria-hidden="true" />
          Create CV
        </DialogTrigger>
        <DialogContent portalContainer={portalContainer} showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogTitle>Create CV</DialogTitle>
          <form
            onSubmit={(event) => void handleSubmit(submit)(event)}
            noValidate
            className="flex flex-col gap-4"
            aria-busy={isSubmitting}
          >
            {fields.map(({ name, label }) => {
              const fieldId = `${fieldPrefix}-${name}`;
              const error = errors[name]?.message;
              const Control = name === "description" ? Textarea : Input;
              return (
                <div key={name} className="grid gap-1.5">
                  <label htmlFor={fieldId} className="font-medium">{label}</label>
                  <Control
                    {...register(name)}
                    id={fieldId}
                    required
                    readOnly={isSubmitting}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${fieldId}-error` : undefined}
                    className={name === "description" ? "min-h-24 border-border" : "h-10 border-border"}
                  />
                  {error && <p id={`${fieldId}-error`} className="text-sm text-destructive">{error}</p>}
                </div>
              );
            })}
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <DialogFooter className="mt-1 flex-row justify-end">
              <DialogClose render={<Button variant="outline" disabled={isSubmitting} className="uppercase" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="bg-[#b51f24] text-white uppercase hover:bg-[#95191d]"
              >
                {isSubmitting ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div ref={portalContainer} />
    </div>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { createEmployeeCv, type CreateCvStatus } from "./create-cv-action";
import { CvForm } from "./cv-form";

const errorMessages: Record<Exclude<CreateCvStatus, "created">, string> = {
  unavailable: "Failed to create CV. Please try again.",
  invalid: "Check the CV details and try again.",
  expired: "Your session has expired. Sign in to continue.",
  forbidden: "Creating a CV requires an Employee session.",
};

export function CreateCvDialog() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const portalContainer = useRef<HTMLDivElement>(null);
  const saving = useRef(false);

  return (
    <div className="ml-auto flex items-center gap-3">
      <span role="status" className="text-sm text-muted-foreground">{created && "CV created"}</span>
      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (saving.current) return;
        if (nextOpen) setCreated(false);
        setOpen(nextOpen);
      }}>
        <DialogTrigger render={<Button variant="ghost" className="h-11 gap-2 px-4 text-destructive uppercase hover:text-destructive aria-expanded:text-destructive" />}>
          <Plus aria-hidden="true" /> Create CV
        </DialogTrigger>
        <DialogContent portalContainer={portalContainer} showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogTitle>Create CV</DialogTitle>
          {open && <CvForm action="Create" onPendingChange={(pending) => { saving.current = pending; }} onSave={async (fields) => {
            const status = await createEmployeeCv(fields);
            if (status !== "created") return errorMessages[status];
            setCreated(true);
            setOpen(false);
          }} />}
        </DialogContent>
      </Dialog>
      <div ref={portalContainer} />
    </div>
  );
}

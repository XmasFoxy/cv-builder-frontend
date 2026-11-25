"use client";

import { useId, useRef, useState, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { EmployeeSkill } from "../employees/[employeeId]/employee-profile-data";
import { skillMasteryLabels, type Mastery } from "../employees/[employeeId]/qualification-levels";
import { changeCvSkills, type CvSkillChange } from "./cv-skills-actions";

type Intent =
  | { action: "add"; options: EmployeeSkill[] }
  | { action: "update"; skill: EmployeeSkill }
  | { action: "remove"; names: string[] };

const titles = { add: "Add skill", update: "Update skill", remove: "Remove skills" };
const actions = { add: "Add", update: "Save", remove: "Confirm" };
const pendingActions = { add: "Adding…", update: "Saving…", remove: "Removing…" };
const messages = {
  expired: "Your session has expired. Sign in to continue.",
  forbidden: "This CV is no longer available to you.",
  duplicate: "This skill has already been added.",
  missingOwnerSkill: "This skill is no longer on your profile.",
  missingCvSkill: "This skill is no longer on the CV.",
} as const;

export function CvSkillDialog({ cvId, intent, trigger, onSaved }: {
  cvId: string;
  intent: Intent;
  trigger: ReactElement;
  onSaved: () => void;
}) {
  const id = useId();
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [mastery, setMastery] = useState<Mastery | "">("");
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState("");
  const { action } = intent;
  const selected = intent.action === "add" ? intent.options.find((option) => option.name === name) : undefined;
  const invalidSkill = action === "add" && touched && !selected;
  let change: CvSkillChange | undefined;
  if (intent.action === "add" && selected) {
    change = { action: "add", name: selected.name, mastery: selected.mastery };
  } else if (intent.action === "update" && mastery && mastery !== intent.skill.mastery) {
    change = { action: "update", name: intent.skill.name, mastery };
  } else if (intent.action === "remove" && intent.names.length) {
    change = { action: "remove", name: intent.names };
  }

  function onOpenChange(nextOpen: boolean) {
    if (submitting.current) return;
    if (nextOpen) {
      setName(intent.action === "update" ? intent.skill.name : "");
      setMastery(intent.action === "update" ? intent.skill.mastery : "");
      setTouched(false);
      setMessage("");
    }
    setOpen(nextOpen);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!change || submitting.current) return;

    submitting.current = true;
    setPending(true);
    setMessage("");
    const failure = `Failed to ${action} ${action === "remove" ? "skills" : "skill"}. Please try again.`;
    try {
      const result = await changeCvSkills(cvId, change);
      if (result === "saved") {
        setOpen(false);
        onSaved();
      } else {
        setMessage(result in messages ? messages[result as keyof typeof messages] : failure);
      }
    } catch {
      setMessage(failure);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogTitle>{titles[action]}</DialogTitle>
        {intent.action === "remove" && (
          <DialogDescription>
            Are you sure you want to remove {intent.names.length} {intent.names.length === 1 ? "skill" : "skills"}?
          </DialogDescription>
        )}
        <form onSubmit={submit} noValidate aria-busy={pending} className="grid gap-4">
          {intent.action === "add" && intent.options.length === 0 &&
            <p role="status" className="text-muted-foreground">No more skills available from your profile.</p>}
          {intent.action !== "remove" && (
            <div className="grid gap-1.5">
              <label htmlFor={`${id}-skill`} className="font-medium">Skill</label>
              <NativeSelect id={`${id}-skill`} required value={name} disabled={pending || intent.action === "update"}
                onChange={(event) => setName(event.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={invalidSkill} aria-describedby={invalidSkill ? `${id}-skill-error` : undefined}
                className="w-full [&>select]:h-11">
                {intent.action === "add" ? (
                  <>
                    <NativeSelectOption value="">Select skill</NativeSelectOption>
                    {intent.options.map((option) => <NativeSelectOption key={option.name} value={option.name}>{option.name}</NativeSelectOption>)}
                  </>
                ) : <NativeSelectOption value={intent.skill.name}>{intent.skill.name}</NativeSelectOption>}
              </NativeSelect>
              {invalidSkill && <p id={`${id}-skill-error`} className="text-sm text-destructive">Skill is required</p>}
            </div>
          )}
          {intent.action === "update" && (
            <div className="grid gap-1.5">
              <label htmlFor={`${id}-mastery`} className="font-medium">Skill Mastery</label>
              <NativeSelect id={`${id}-mastery`} required value={mastery} disabled={pending}
                onChange={(event) => setMastery(event.target.value as Mastery)} className="w-full [&>select]:h-11">
                {Object.entries(skillMasteryLabels).map(([value, label]) =>
                  <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
              </NativeSelect>
            </div>
          )}
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <DialogFooter className="flex-row justify-end">
            <DialogClose render={<Button variant="outline" disabled={pending} className="uppercase" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!change || pending} className="bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
              {pending ? pendingActions[action] : actions[action]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

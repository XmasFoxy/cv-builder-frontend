"use client";

import { Plus } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Option = { id: string; name: string };
type Level = { value: string; label: string };

export function AddQualificationDialog<OptionType extends Option>({
  kind, options, levels, add,
}: {
  kind: "skill" | "language";
  options: OptionType[];
  levels: Level[];
  add: (option: OptionType, level: string) => Promise<string>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [level, setLevel] = useState("");
  const [touched, setTouched] = useState({ item: false, level: false });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const selected = options.find((option) => option.id === selectedId);
  const validLevel = levels.some(({ value }) => value === level);
  const label = kind === "skill" ? "Skill" : "Language";
  const levelLabel = kind === "skill" ? "Skill Mastery" : "Language Proficiency";
  const fields = [
    {
      key: "item", label, value: selected ? selectedId : "", setValue: setSelectedId,
      options: options.map(({ id, name }) => ({ value: id, label: name })), valid: Boolean(selected),
    },
    { key: "level", label: levelLabel, value: level, setValue: setLevel, options: levels, valid: validLevel },
  ] as const;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !validLevel || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setMessage("");
    try {
      const status = await add(selected, level);
      if (status === "added") setOpen(false);
      else if (status === "duplicate") setMessage(`This ${kind} has already been added.`);
      else if (status === "expired") setMessage(`Sign in again to add a ${kind}.`);
      else setMessage(`Failed to add ${kind}. Please try again.`);
    } catch {
      setMessage(`Failed to add ${kind}. Please try again.`);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (submitting.current) return;
      if (nextOpen) {
        setSelectedId("");
        setLevel("");
        setTouched({ item: false, level: false });
        setMessage("");
      }
      setOpen(nextOpen);
    }}>
      <div className="mt-10 flex justify-end">
        <DialogTrigger render={<Button variant="ghost" className="h-11 gap-2 px-4 text-[#626262] uppercase" />}>
          <Plus aria-hidden="true" /> Add {kind}
        </DialogTrigger>
      </div>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogTitle>Add {kind}</DialogTitle>
        <form onSubmit={submit} noValidate aria-busy={pending} className="grid gap-4">
          {options.length === 0 && <p role="status" className="text-muted-foreground">No more {kind}s available.</p>}
          {fields.map((field) => {
            const fieldId = `${id}-${field.key}`;
            const error = touched[field.key] && !field.valid;
            return (
              <div className="grid gap-1.5" key={field.key}>
                <label htmlFor={fieldId} className="font-medium">{field.label}</label>
                <NativeSelect id={fieldId} required disabled={pending} value={field.value}
                  onChange={(event) => field.setValue(event.target.value)}
                  onBlur={() => setTouched((prior) => ({ ...prior, [field.key]: true }))}
                  aria-invalid={error} aria-describedby={error ? `${fieldId}-error` : undefined}
                  className="w-full [&>select]:h-11">
                  <NativeSelectOption value="">Select {field.label.toLowerCase()}</NativeSelectOption>
                  {field.options.map((option) => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}
                </NativeSelect>
                {error && <p id={`${fieldId}-error`} className="text-sm text-destructive">{field.label[0]}{field.label.slice(1).toLowerCase()} is required</p>}
              </div>
            );
          })}
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <DialogFooter className="flex-row justify-end">
            <DialogClose render={<Button variant="outline" disabled={pending} className="uppercase" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!selected || !validLevel || pending} className="bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
              {pending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

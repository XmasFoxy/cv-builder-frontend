"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { changeCvProject, type CvProjectChange } from "./cv-projects-actions";
import { projectDate, type CatalogProject, type CvProject } from "./cv-projects-model";

export type ProjectIntent =
  | { action: "add"; projects: CatalogProject[] }
  | { action: "update" | "remove"; item: CvProject };

const titles = { add: "Add project", update: "Update project", remove: "Remove project" };
const actions = { add: "Add", update: "Save", remove: "Confirm" };
const saving = { add: "Adding…", update: "Saving…", remove: "Removing…" };

const systemErrors = {
  expired: "Your session has expired. Sign in to continue.",
  forbidden: "This CV is no longer available to you.",
  projectHasBeenAdded: "This project has already been added to the CV.",
  projectNotFound: "This project is no longer available in the catalog.",
  cvProjectNotFound: "This project is no longer on the CV.",
} as const;

const fieldErrors = {
  invalidProjectStartDate: { start: "Enter a valid start date" },
  invalidProjectEndDate: { end: "Enter a valid end date" },
  projectStartOutsideDuration: { start: "Start date must be within project duration" },
  projectEndBeforeStart: { end: "End date cannot be earlier than start date" },
  projectEndOutsideDuration: { end: "End date must be within project duration" },
  projectRoleRequired: { roles: "At least one role must be selected" },
  projectRoleUnavailable: { roles: "A selected role is no longer available" },
} as const;

type Fields = "project" | "start" | "end" | "roles";
type Errors = Partial<Record<Fields, string>>;

function validate(project: CatalogProject | undefined, start: string, end: string, roles: string[]): Errors {
  const errors: Errors = {};
  if (!project) errors.project = "Project is required";
  if (!start) errors.start = "Start date is required";
  else if (project && (start < project.start_date || (project.end_date && start > project.end_date))) {
    errors.start = "Start date must be within project duration";
  }
  if (end && start && end < start) errors.end = "End date cannot be earlier than start date";
  else if (end && project && (end < project.start_date || (project.end_date && end > project.end_date))) {
    errors.end = "End date must be within project duration";
  }
  if (!roles.length) errors.roles = "At least one role must be selected";
  return errors;
}

export function CvProjectDialog({ cvId, intent, roleOptions, returnFocus, onClose, onSaved }: {
  cvId: string;
  intent: ProjectIntent;
  roleOptions: string[];
  returnFocus: () => HTMLElement | null;
  onClose: () => void;
  onSaved: (announcement: string) => void;
}) {
  const id = useId();
  const { action } = intent;
  const item = intent.action === "add" ? undefined : intent.item;
  const existingResponsibilities = item?.responsibilities.join("\n") ?? "";
  const [project, setProject] = useState(item?.project);
  const [start, setStart] = useState(item?.start_date ?? "");
  const [end, setEnd] = useState(item?.end_date ?? "");
  const [roles, setRoles] = useState(item?.roles.filter((role) => role.trim()) ?? []);
  const [responsibilities, setResponsibilities] = useState(existingResponsibilities);
  const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});
  const [remoteErrors, setRemoteErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [open, setOpen] = useState(true);
  const rolesLabel = `${id}-roles`;
  const durationId = `${id}-duration`;
  const roleChoices = [...new Set([...roleOptions, ...(item?.roles ?? []).filter((role) => role.trim())])];
  const validation = validate(project, start, end, roles);
  const changed = !item || start !== item.start_date || end !== (item.end_date ?? "") ||
    roles.length !== item.roles.length || roles.some((role) => !item.roles.includes(role)) ||
    responsibilities !== existingResponsibilities;
  const valid = action === "remove" || (changed && !Object.keys(validation).length && !Object.keys(remoteErrors).length);

  function touch(field: Fields) {
    setTouched((previous) => ({ ...previous, [field]: true }));
  }

  function error(field: Fields) {
    return remoteErrors[field] ?? (touched[field] ? validation[field] : undefined);
  }

  function errorText(field: Fields) {
    const text = error(field);
    return text && <p id={`${id}-${field}-error`} role="alert" className="text-destructive">{text}</p>;
  }

  function inputProps(field: Fields, description?: string) {
    return {
      id: `${id}-${field}`,
      "aria-invalid": Boolean(error(field)),
      "aria-describedby": [description, error(field) && `${id}-${field}-error`].filter(Boolean).join(" ") || undefined,
      onBlur: () => touch(field),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !valid || submitting.current) return;
    const change: CvProjectChange = action === "remove" ? { action, projectId: project.id } : {
      action,
      projectId: project.id,
      start_date: start,
      end_date: end || null,
      roles,
      responsibilities: responsibilities === existingResponsibilities ? item?.responsibilities ?? []
        : responsibilities.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    };

    submitting.current = true;
    setPending(true);
    setMessage("");
    const failure = `Failed to ${action} project. Please try again.`;
    try {
      const result = await changeCvProject(cvId, change);
      if (result === "saved") {
        setOpen(false);
        onSaved(`${project.name} ${action === "add" ? "added" : action === "update" ? "updated" : "removed"}`);
      } else if (Object.hasOwn(fieldErrors, result)) {
        setRemoteErrors(fieldErrors[result as keyof typeof fieldErrors]);
      } else {
        setMessage(Object.hasOwn(systemErrors, result) ? systemErrors[result as keyof typeof systemErrors] : failure);
      }
    } catch {
      setMessage(failure);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!submitting.current) setOpen(nextOpen); }}
      onOpenChangeComplete={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent finalFocus={returnFocus} showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-xl">
        <DialogTitle className="text-lg">{titles[action]}</DialogTitle>
        {action === "remove" && (
          <DialogDescription className="wrap-anywhere">Are you sure you want to remove project {item?.project.name}?</DialogDescription>
        )}
        <form onSubmit={submit} noValidate aria-busy={pending} className="grid gap-4"
          onChange={() => setRemoteErrors({})}>
          {intent.action === "add" && intent.projects.length === 0 && (
            <p role="status" className="text-muted-foreground">No projects available to add.</p>
          )}
          {action !== "remove" && (
            <>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-project`}>Name</label>
                <NativeSelect {...inputProps("project")} required disabled={pending || action === "update"}
                  value={project?.id ?? ""} className="w-full [&>select]:h-10"
                  onChange={(event) => {
                    if (intent.action !== "add") return;
                    const selection = intent.projects.find(({ id }) => id === event.target.value);
                    setProject(selection);
                    setStart(selection?.start_date ?? "");
                    setEnd("");
                  }}>
                  {intent.action === "add" ? (
                    <>
                      <NativeSelectOption value="">Select project</NativeSelectOption>
                      {intent.projects.map((option) => <NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>)}
                    </>
                  ) : <NativeSelectOption value={item?.project.id}>{item?.project.name}</NativeSelectOption>}
                </NativeSelect>
                {errorText("project")}
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-domain`}>Domain</label>
                <Input id={`${id}-domain`} disabled value={project?.domain ?? ""} />
              </div>
              <div className="grid gap-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor={`${id}-start`}>Start Date</label>
                    <Input {...inputProps("start", project && durationId)} required type="date" value={start}
                      min={project?.start_date} max={project?.end_date ?? undefined} disabled={pending}
                      onChange={(event) => { setStart(event.target.value); touch("start"); }} />
                    {errorText("start")}
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor={`${id}-end`}>End Date</label>
                    <Input {...inputProps("end", project && durationId)} type="date" value={end}
                      min={start || project?.start_date} max={project?.end_date ?? undefined} disabled={pending}
                      onChange={(event) => { setEnd(event.target.value); touch("end"); }} />
                    {errorText("end")}
                  </div>
                </div>
                {project && <p id={durationId} className="text-xs text-muted-foreground">
                  Project duration {projectDate(project.start_date)} – {project.end_date ? projectDate(project.end_date) : "Till now"}
                </p>}
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-description`}>Description</label>
                <Textarea id={`${id}-description`} disabled value={project?.description ?? ""} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-environment`}>Environment</label>
                <Input id={`${id}-environment`} disabled value={project?.environment.join(", ") ?? ""} />
              </div>
              <fieldset aria-labelledby={rolesLabel} aria-invalid={Boolean(error("roles"))}
                aria-describedby={error("roles") ? `${id}-roles-error` : undefined} disabled={pending}
                onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) touch("roles"); }}>
                <legend id={rolesLabel} className="mb-1.5">Roles (required)</legend>
                {roleChoices.length ? (
                  <div className="grid max-h-28 gap-x-4 gap-y-1 overflow-y-auto rounded-lg border px-3 py-2 sm:grid-cols-2">
                    {roleChoices.map((role) => (
                      <label key={role} className="flex min-h-7 items-center gap-2 wrap-anywhere">
                        <input type="checkbox" checked={roles.includes(role)}
                          className="size-4 shrink-0 accent-[#b51f24] focus-visible:outline-2 focus-visible:outline-offset-2"
                          onChange={(event) => {
                            setRoles(event.target.checked ? [...roles, role] : roles.filter((current) => current !== role));
                            touch("roles");
                          }} />
                        {role}
                      </label>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No roles available.</p>}
                {errorText("roles")}
              </fieldset>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-responsibilities`}>Responsibilities</label>
                <Textarea id={`${id}-responsibilities`} value={responsibilities} disabled={pending} aria-describedby={`${id}-responsibilities-hint`}
                  onChange={(event) => setResponsibilities(event.target.value)} />
                <p id={`${id}-responsibilities-hint`} className="text-xs text-muted-foreground">Enter one responsibility per line.</p>
              </div>
            </>
          )}
          {message && <p role="alert" className="text-destructive">{message}</p>}
          <DialogFooter className="-mx-5 -mb-5 flex-row justify-end">
            <DialogClose render={<Button autoFocus={action === "remove"} variant="outline" disabled={pending} className="uppercase" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!valid || pending} className="bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
              {pending ? saving[action] : actions[action]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

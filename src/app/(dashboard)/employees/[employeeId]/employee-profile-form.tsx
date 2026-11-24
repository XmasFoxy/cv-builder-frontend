"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { saveEmployeeProfile } from "./employee-profile-actions";
import type { EmployeeProfile, ProfileOptions } from "./employee-profile-data";
import { employeeProfileSchema, type EmployeeProfileFields } from "./employee-profile-schema";

const nameFields = [
  { name: "first_name", label: "First Name" },
  { name: "last_name", label: "Last Name" },
] as const;

export function EmployeeProfileForm({ employee, options }: { employee: EmployeeProfile; options: ProfileOptions }) {
  const fieldPrefix = useId();
  const [outcome, setOutcome] = useState("");
  const [saved, setSaved] = useState(false);
  const { formState: { errors, isDirty, isSubmitting, isValid }, handleSubmit, register, reset } = useForm<EmployeeProfileFields>({
    defaultValues: {
      first_name: employee.profile.first_name ?? "",
      last_name: employee.profile.last_name ?? "",
      departmentId: employee.department?.id ?? "",
      positionId: employee.position?.id ?? "",
    },
    resolver: zodResolver(employeeProfileSchema),
    mode: "all",
  });

  const assignments = [
    { name: "departmentId", label: "Department", choices: options.departments },
    { name: "positionId", label: "Position", choices: options.positions },
  ] as const;

  async function save(values: EmployeeProfileFields) {
    setOutcome("");
    setSaved(false);
    const result = await saveEmployeeProfile(employee.id, values).catch(() => "unavailable");
    if (result === "updated") {
      reset(values);
      setSaved(true);
      setOutcome("Profile updated");
    } else {
      setOutcome(result === "expired" ? "Sign in again to update your profile." : "Failed to update profile. Please try again.");
    }
  }

  return (
    <form className="mt-12" noValidate onSubmit={handleSubmit(save)} aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="grid gap-x-8 gap-y-5 @md:grid-cols-2">
        <legend className="sr-only">Profile information</legend>
        {nameFields.map(({ name, label }) => {
          const id = `${fieldPrefix}-${name}`;
          const error = errors[name]?.message;
          return (
            <div key={name} className="min-w-0">
              <label htmlFor={id} className="block px-4 text-xs text-[#626262]">{label}</label>
              <Input {...register(name)} id={id} required aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined} className="h-12 rounded-none border-[#aaa] px-3" />
              {error && <p id={`${id}-error`} className="mt-1 text-xs text-[#b31f24]">{error}</p>}
            </div>
          );
        })}
        {assignments.map(({ name, label, choices }) => {
          const id = `${fieldPrefix}-${name}`;
          const error = errors[name]?.message;
          return (
            <div key={name} className="min-w-0">
              <label htmlFor={id} className="block px-4 text-xs text-[#626262]">{label}</label>
              <NativeSelect {...register(name)} id={id} required aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className="w-full [&>select]:h-12 [&>select]:rounded-none [&>select]:border-[#aaa] [&>select]:pl-3">
                <NativeSelectOption value="">Select {label.toLowerCase()}</NativeSelectOption>
                {choices.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}
              </NativeSelect>
              {error && <p id={`${id}-error`} className="mt-1 text-xs text-[#b31f24]">{error}</p>}
            </div>
          );
        })}
      </fieldset>
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        {outcome && <p role={saved ? "status" : "alert"} className={saved ? "text-sm text-[#2e2e2e]" : "text-sm text-[#b31f24]"}>{outcome}</p>}
        <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}
          className="h-12 min-w-36 rounded-full bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
          {isSubmitting ? "Updating…" : "Update"}
        </Button>
      </div>
    </form>
  );
}

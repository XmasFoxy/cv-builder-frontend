import { useState } from "react";
import { Eye } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

type AuthFieldProps = {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
  disabled?: boolean;
  visibleLabel?: boolean;
  placeholder?: string;
};

export function AuthField({
  id,
  label,
  type,
  autoComplete,
  registration,
  error,
  disabled,
  visibleLabel = false,
  placeholder = label,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className={visibleLabel ? "mb-1 block px-3 text-xs text-[#666666]" : "sr-only"}>
        {label}
      </label>

      <div className="relative">
        <input
          {...registration}
          id={id}
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          className={`h-11 w-full rounded-sm border border-[#cccccc] bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-[#888888] focus:border-[#cf3033] disabled:opacity-60${isPassword ? " pr-12" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            aria-controls={id}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-4 flex cursor-pointer items-center text-[#888888] transition-colors hover:text-[#cf3033]"
          >
            <span
              aria-hidden="true"
              className="relative flex items-center justify-center"
            >
              <Eye size={20} />
              {!showPassword && (
                <span className="absolute h-[1.5px] w-[25px] rotate-45 rounded-full bg-current" />
              )}
            </span>
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-[#cf3033]">
          {error}
        </p>
      )}
    </div>
  );
}

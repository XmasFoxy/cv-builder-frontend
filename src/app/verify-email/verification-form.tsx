"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthActions, AuthLayout } from "@/components/auth/auth-layout";
import { verifyEmail } from "./actions";

const codeLength = 6;
const initialDigits = ["", "", "", "", "", ""];
const errorMessages = {
  invalid: "Invalid verification code.",
  expired: "Verification code has expired.",
  "sign-in": "Your session has expired. Sign in to continue.",
  unavailable: "Something went wrong. Please try again later.",
};

export function VerificationForm() {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState(initialDigits);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [pending, setPending] = useState(false);

  function updateDigits(index: number, value: string) {
    const typed = value.replace(/\D/g, "");
    const start = typed.length >= codeLength ? 0 : index;
    const chars = typed.slice(0, codeLength - start).split("");

    setDigits((previous) => {
      const next = [...previous];
      next.splice(start, Math.max(chars.length, 1), ...(chars.length ? chars : [""]));
      return next;
    });
    setError("");
    if (chars.length) {
      inputs.current[Math.min(start + chars.length, codeLength - 1)]?.focus();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const code = digits.join("");
    if (code.length !== codeLength) {
      setError(code ? "Please enter a valid 6-digit code." : "Verification code is required.");
      inputs.current[digits.indexOf("")]?.focus();
      return;
    }

    setError("");
    setNeedsSignIn(false);
    setPending(true);
    const result = await verifyEmail(code).catch(() => "unavailable" as const);
    if (result === "success") {
      router.replace("/employees");
      return;
    }

    setPending(false);
    setError(errorMessages[result]);
    setNeedsSignIn(result === "sign-in");
  }

  return (
    <AuthLayout
      title="Email verification"
      description="Enter the verification code we sent to your email."
      onSubmit={onSubmit}
    >
      <fieldset className="flex justify-center gap-2 sm:gap-3">
        <legend className="sr-only">Verification code</legend>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(input) => { inputs.current[index] = input; }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={codeLength}
            aria-label={`Digit ${index + 1} of ${codeLength}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "verification-error" : undefined}
            value={digit}
            disabled={pending}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => updateDigits(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
              if (pasted) updateDigits(index, pasted);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || (event.key === "Backspace" && !digit)) {
                event.preventDefault();
                inputs.current[index - 1]?.focus();
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                inputs.current[index + 1]?.focus();
              }
            }}
            className="h-10 w-9 rounded-sm border border-[#aaa] bg-transparent text-center text-lg outline-none transition-colors focus-visible:border-[#cf3033] focus-visible:ring-1 focus-visible:ring-[#cf3033] aria-invalid:border-[#cf3033] disabled:opacity-60 sm:h-11 sm:w-11"
          />
        ))}
      </fieldset>
      {error && (
        <p id="verification-error" role="alert" className="text-center text-sm text-[#cf3033]">
          {error}
        </p>
      )}
      {needsSignIn && (
        <Link className="self-center text-sm underline" href="/login?next=%2Fverify-email">SIGN IN</Link>
      )}
      <AuthActions
        disabled={pending}
        submitLabel={pending ? "CONFIRMING..." : "CONFIRM"}
        linkHref="/employees"
        linkLabel="LATER"
      />
    </AuthLayout>
  );
}

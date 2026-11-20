import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

const authLinks = [
  { href: "/login", label: "SIGN IN" },
  { href: "/signup", label: "SIGN UP" },
] as const;

type AuthLayoutProps = {
  currentPage?: (typeof authLinks)[number]["href"];
  title: string;
  description: string;
  onSubmit: NonNullable<ComponentProps<"form">["onSubmit"]>;
  children: ReactNode;
};

export function AuthLayout({
  currentPage,
  title,
  description,
  onSubmit,
  children,
}: AuthLayoutProps) {
  return (
    <main className={currentPage
      ? "min-h-screen bg-[#f5f5f7] text-[#333333]"
      : "grid min-h-screen place-items-center bg-[#f5f5f7] py-10 text-[#333333]"}
    >
      {currentPage && <nav
        aria-label="Authentication navigation"
        className="flex justify-center pt-6 text-sm font-medium"
      >
        {authLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={href === currentPage ? "page" : undefined}
            className="w-32 cursor-pointer border-b-2 border-transparent pb-4 text-center transition-colors hover:text-[#cf3033] aria-[current=page]:border-[#cf3033] aria-[current=page]:text-[#cf3033]"
          >
            {label}
          </Link>
        ))}
      </nav>}

      <section className={currentPage
        ? "mx-auto mt-24 w-full max-w-[420px] px-6 pb-8 sm:mt-32"
        : "mx-auto w-full max-w-[520px] px-6"}
      >
        <h1 className="text-center text-3xl font-normal">{title}</h1>
        <p className="mt-4 text-center text-sm text-[#666666]">{description}</p>

        <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col gap-6">
          {children}
        </form>
      </section>
    </main>
  );
}

type AuthActionsProps = {
  disabled: boolean;
  submitLabel: string;
  linkHref: string;
  linkLabel: string;
};

export function AuthActions({
  disabled,
  submitLabel,
  linkHref,
  linkLabel,
}: AuthActionsProps) {
  return (
    <div className="mt-4 flex flex-col items-center gap-5">
      <button
        type="submit"
        disabled={disabled}
        className="h-11 min-w-[140px] cursor-pointer rounded-full bg-[#cf3033] px-8 text-sm font-medium text-white transition-colors hover:bg-[#b9292c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf3033] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>

      <Link
        href={linkHref}
        className="cursor-pointer text-sm transition-colors hover:text-[#cf3033]"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

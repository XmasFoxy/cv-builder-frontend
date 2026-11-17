
"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Подключим GraphQL-авторизацию на следующем этапе.
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#333333] dark:bg-[#2d2d2d] dark:text-white">
      {/* Вкладки авторизации */}
      <nav className="flex justify-center pt-6 text-sm font-medium">
        <Link
          href="/login"
          aria-current="page"
          className="w-32 border-b-2 border-[#cf3033] pb-4 text-center text-[#cf3033]"
        >
          SIGN IN
        </Link>

        <Link
          href="/signup"
          className="w-32 pb-4 text-center transition-colors hover:text-[#cf3033]"
        >
          SIGN UP
        </Link>
      </nav>

      {/* Основная форма */}
      <section className="mx-auto mt-24 w-full max-w-[420px] px-6 sm:mt-32">
        <h1 className="text-center text-3xl font-normal">
          Welcome back
        </h1>

        <p className="mt-4 text-center text-sm text-[#666666] dark:text-[#cccccc]">
          Hello again! Sign in to continue
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col gap-6"
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-sm border border-[#cccccc] bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-[#888888] focus:border-[#cf3033] dark:border-[#666666] dark:placeholder:text-[#aaaaaa]"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-sm border border-[#cccccc] bg-transparent px-4 pr-12 text-sm outline-none transition-colors placeholder:text-[#888888] focus:border-[#cf3033] dark:border-[#666666] dark:placeholder:text-[#aaaaaa]"
            />

            <button
              type="button"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-4 flex items-center text-[#888888] transition-colors hover:text-[#cf3033]"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Действия */}
          <div className="mt-4 flex flex-col items-center gap-5">
            <button
              type="submit"
              className="h-11 min-w-[140px] rounded-full bg-[#cf3033] px-8 text-sm font-medium text-white transition-colors hover:bg-[#b9292c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf3033]"
            >
              SIGN IN
            </button>

            <Link
              href="/forgot-password"
              className="text-sm transition-colors hover:text-[#cf3033]"
            >
              FORGOT PASSWORD
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useMutation } from "@apollo/client/react";

import {
  LOGIN_MUTATION,
  type LoginResponse,
  type LoginVariables,
} from "@/graphql/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading, error }] = useMutation<
    LoginResponse,
    LoginVariables
  >(LOGIN_MUTATION);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await login({
        variables: {
          auth: {
            email,
            password,
          },
        },
      });

      if (result.data?.login) {
        console.log("Login successful:", result.data.login.user);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#333333] dark:bg-[#2d2d2d] dark:text-white">
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
              disabled={loading}
              className="h-11 w-full rounded-sm border border-[#cccccc] bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-[#888888] focus:border-[#cf3033] disabled:opacity-60 dark:border-[#666666] dark:placeholder:text-[#aaaaaa]"
            />
          </div>

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
              disabled={loading}
              className="h-11 w-full rounded-sm border border-[#cccccc] bg-transparent px-4 pr-12 text-sm outline-none transition-colors placeholder:text-[#888888] focus:border-[#cf3033] disabled:opacity-60 dark:border-[#666666] dark:placeholder:text-[#aaaaaa]"
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
              <span className="relative flex items-center justify-center">
                <Eye size={20} />

                {!showPassword && (
                  <span
                    aria-hidden="true"
                    className="absolute h-[1.5px] w-[25px] rotate-45 rounded-full bg-current"
                  />
                )}
              </span>
            </button>
          </div>

          {error && (
            <p role="alert" className="text-center text-sm text-[#cf3033]">
              {error.message}
            </p>
          )}

          <div className="mt-4 flex flex-col items-center gap-5">
            <button
              type="submit"
              disabled={loading}
              className="h-11 min-w-[140px] rounded-full bg-[#cf3033] px-8 text-sm font-medium text-white transition-colors hover:bg-[#b9292c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf3033] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
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

import type { cookies } from "next/headers";

export const accessCookie = "cv_access_token";
export const refreshCookie = "cv_refresh_token";

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function writeSession(store: CookieStore, tokens: SessionTokens) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  store.set(accessCookie, tokens.access_token, { ...options, maxAge: 10 * 60 });
  store.set(refreshCookie, tokens.refresh_token, { ...options, maxAge: 7 * 24 * 60 * 60 });
}

export function clearSession(store: CookieStore) {
  store.delete(accessCookie);
  store.delete(refreshCookie);
}

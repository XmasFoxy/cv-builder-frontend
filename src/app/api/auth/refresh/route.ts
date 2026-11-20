import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { dashboardPaths, refreshSession, verifyAccess } from "@/lib/session";
import { clearSession, refreshCookie, writeSession } from "@/lib/session-cookies";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = dashboardPaths.find((path) => path === url.searchParams.get("next")) ?? "/employees";
  const store = await cookies();
  const refresh = store.get(refreshCookie)?.value;

  try {
    if (refresh) {
      const tokens = await refreshSession(refresh);
      if (tokens) {
        if (!await verifyAccess(tokens.access_token)) {
          throw new Error("New access token was rejected");
        }
        writeSession(store, tokens);
        return NextResponse.redirect(new URL(destination, url), { headers });
      }
    }
  } catch {
    return new Response("The authentication service is temporarily unavailable. Please try again.", {
      status: 503,
      headers,
    });
  }

  clearSession(store);
  return NextResponse.redirect(new URL("/login", url), { headers });
}

import { cookies } from "next/headers";

import { dashboardPaths, refreshSession, verifyAccess } from "@/lib/session";
import { clearSession, refreshCookie, writeSession } from "@/lib/session-cookies";

const headers = { "Cache-Control": "private, no-store" };

function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { ...headers, Location: path } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const [pathname, query] = (url.searchParams.get("next") ?? "").split("?", 2);
  const path = dashboardPaths.find((allowedPath) => allowedPath === pathname) ?? "/employees";
  const destination = pathname === "/employees" && query
    ? `/employees?${new URLSearchParams(query)}`
    : path;
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
        return redirectTo(destination);
      }
    }
  } catch {
    return new Response("The authentication service is temporarily unavailable. Please try again.", {
      status: 503,
      headers,
    });
  }

  clearSession(store);
  return redirectTo("/login");
}

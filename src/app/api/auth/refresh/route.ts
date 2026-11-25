import { cookies } from "next/headers";

import { cvCreatePath, isCvId } from "@/app/(dashboard)/cvs/cvs-url";
import { isEmployeeId } from "@/app/(dashboard)/employees/employees-url";
import { dashboardPaths, refreshSession, verifyAccess } from "@/lib/session";
import { clearSession, refreshCookie, writeSession } from "@/lib/session-cookies";

const headers = { "Cache-Control": "private, no-store" };

function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { ...headers, Location: path } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const [pathname, query] = (url.searchParams.get("next") ?? "").split("?", 2);
  const employeePath = /^\/employees\/([1-9]\d*)(?:\/(?:skills|languages))?$/.exec(pathname);
  const profilePath = employeePath && isEmployeeId(employeePath[1]) ? employeePath[0] : undefined;
  const cvPath = /^\/cvs\/([1-9]\d*)(?:\/(?:skills|preview))?$/.exec(pathname);
  const cvPage = pathname === cvCreatePath ? cvCreatePath : cvPath && isCvId(cvPath[1]) ? cvPath[0] : undefined;
  const path = profilePath ?? cvPage ?? dashboardPaths.find((allowedPath) => allowedPath === pathname) ?? "/employees";
  const destination = (profilePath || cvPage || pathname === "/employees" || pathname === "/cvs") && query
    ? `${path}?${new URLSearchParams(query)}`
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

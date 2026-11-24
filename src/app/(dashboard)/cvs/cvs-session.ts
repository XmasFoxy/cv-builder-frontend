export function readCvAccessClaims(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return;

  try {
    const { role, sub } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const userId = typeof sub === "number" ? String(sub) : sub;

    return {
      role: typeof role === "string" ? role : undefined,
      userId: typeof userId === "string" && /^[1-9]\d*$/.test(userId) ? userId : undefined,
    };
  } catch {
    return undefined;
  }
}

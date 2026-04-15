import { requireRole, isAuthError } from "./auth-guard";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID v4 형식만 허용 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_RE.test(id);
}

/** ADMIN 역할 요구 — PR-B/C에서 동적 라우트에 재사용 */
export async function requireAdmin() {
  const auth = await requireRole("ADMIN");
  if (isAuthError(auth)) return auth;
  return { ok: true as const, auth };
}

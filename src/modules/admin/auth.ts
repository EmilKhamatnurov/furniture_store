import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { verifyPassword } from "@/modules/auth/password";
import { getAdminSession, setAdminCookie } from "./session";

// ---------------------------------------------------------------------------
// Admin auth — single env-configured admin (ADMIN_EMAIL + ADMIN_PASSWORD_HASH).
//
// The scrypt hash uses "$" as a separator (scrypt$salt$hash). Next.js' env
// loader (@next/env) performs $VARIABLE expansion on .env values, which would
// silently corrupt a raw hash to just "scrypt". To stay copy-paste safe we
// store the hash BASE64-encoded in env and decode it here. A raw "scrypt$…"
// value is still accepted for backwards compatibility.
// ---------------------------------------------------------------------------

/** Decode the configured admin hash (base64 or already-raw scrypt format) */
function resolveAdminHash(): string | null {
  const raw = env.ADMIN_PASSWORD_HASH;
  if (!raw) return null;
  if (raw.startsWith("scrypt$")) return raw; // already raw (e.g. escaped \$)
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (decoded.startsWith("scrypt$")) return decoded;
  } catch {
    /* not base64 — fall through */
  }
  return null;
}

/** Whether admin login is configured at all (email + a usable hash) */
export function isAdminConfigured(): boolean {
  return Boolean(env.ADMIN_EMAIL && resolveAdminHash());
}

/**
 * Validate credentials against the env-configured admin.
 * Constant-time password check; email compared case-insensitively.
 */
export async function checkAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const emailOk = email.trim().toLowerCase() === env.ADMIN_EMAIL!.toLowerCase();
  // Always run verify to keep timing roughly constant
  const passOk = await verifyPassword(password, resolveAdminHash());
  return emailOk && passOk;
}

/** Log the admin in (sets the cookie). Caller must have verified credentials. */
export async function loginAdmin(email: string): Promise<void> {
  await setAdminCookie(email);
}

/** Returns the admin email or null (no redirect). For conditional UI. */
export async function getAdminEmail(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.email ?? null;
}

/**
 * Guard for admin pages & actions. Redirects to /admin/login when not authed.
 * Returns the admin email on success.
 */
export async function requireAdmin(): Promise<string> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session.email;
}

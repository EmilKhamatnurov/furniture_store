import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

// ---------------------------------------------------------------------------
// Stateless session — signed cookie (HMAC-SHA256 over a JSON payload).
// No session table: the cookie itself is the credential, signed with
// APP_SECRET. Format:  base64url(payload).base64url(signature)
//
// Trade-off: cannot revoke a single token server-side before expiry. Adequate
// for a storefront account; rotate APP_SECRET to invalidate everything.
// ---------------------------------------------------------------------------

const COOKIE_NAME = "fs_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  sub: string; // customer id
  email: string;
  iat: number; // issued-at (unix seconds)
  exp: number; // expiry (unix seconds)
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", env.APP_SECRET).update(payloadB64).digest());
}

/** Build a signed token string for the given customer */
export function createSessionToken(customerId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: customerId,
    email,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Verify a token's signature & expiry; returns the payload or null */
export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = sign(payloadB64);

  // Constant-time signature comparison
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers — set/clear may only run in a Server Action or Route Handler.
// getSession() reads the cookie and can run anywhere (RSC included).
// ---------------------------------------------------------------------------

export async function setSessionCookie(customerId: string, email: string): Promise<void> {
  const token = createSessionToken(customerId, email);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

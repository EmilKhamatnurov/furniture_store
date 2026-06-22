import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

// ---------------------------------------------------------------------------
// Admin session — separate signed cookie from the customer session.
// Stateless HMAC-SHA256 over a JSON payload (signed with APP_SECRET).
// Shorter lifetime than customer sessions (admin is privileged).
// ---------------------------------------------------------------------------

const COOKIE_NAME = "fs_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export interface AdminSessionPayload {
  email: string;
  role: "admin";
  iat: number;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(payloadB64: string): string {
  // Domain-separated from customer tokens via the "admin:" prefix
  return b64url(
    createHmac("sha256", env.APP_SECRET).update(`admin:${payloadB64}`).digest()
  );
}

export function createAdminToken(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    email,
    role: "admin",
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = sign(payloadB64);

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as AdminSessionPayload;
    if (payload.role !== "admin") return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(email: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createAdminToken(email), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

// ---------------------------------------------------------------------------
// Order access tokens — capability URLs for guest order viewing.
//
// The order confirmation page exposes PII (name, phone, address). A bare
// /orders/<uuid> must NOT reveal it to anyone who happens to know the id.
// We append a signed token (?t=) to order links in checkout redirects and
// emails; the page also grants access to the order's owner via session.
//
// Token = base64url(HMAC-SHA256("order:" + orderId, APP_SECRET)). Stable per
// order (email links are long-lived) and unguessable without APP_SECRET.
// ---------------------------------------------------------------------------

export function createOrderAccessToken(orderId: string): string {
  return createHmac("sha256", env.APP_SECRET)
    .update(`order:${orderId}`)
    .digest("base64url");
}

export function verifyOrderAccessToken(
  orderId: string,
  token: string | undefined | null
): boolean {
  if (!token) return false;
  const expected = createOrderAccessToken(orderId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

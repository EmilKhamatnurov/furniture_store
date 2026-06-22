"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { registerSchema, loginSchema } from "./schema";
import { hashPassword, verifyPassword, setSessionCookie } from "@/modules/auth";
import {
  createCustomer,
  getCustomerByEmail,
  emailExists,
  touchLastLogin,
  recordConsent,
} from "@/modules/customers";
import { rateLimit, retryAfterText } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// Auth server actions — used with useActionState in the auth forms.
// redirect() is called outside try/catch (it works by throwing internally).
// ---------------------------------------------------------------------------

export interface AuthState {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
}

// Privacy-policy consent text shown at registration. Bump the version and the
// text together — the hash is stored as legal evidence of what was agreed.
const PRIVACY_POLICY_VERSION = "v2026-01-01";
const PRIVACY_CONSENT_TEXT =
  "Я даю согласие на обработку моих персональных данных в соответствии с политикой конфиденциальности (152-ФЗ).";

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function registerAction(
  _prev: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  // Throttle account-creation abuse: 5 sign-ups / 15 min per IP
  const ip = (await clientIp()) ?? "unknown";
  const rl = await rateLimit("register", ip, { limit: 5, windowSec: 900 });
  if (!rl.ok) {
    return { error: `Слишком много попыток. Повторите ${retryAfterText(rl.retryAfterSec)}` };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;

  if (await emailExists(email)) {
    return { fieldErrors: { email: ["Этот email уже зарегистрирован"] } };
  }

  let customerId: string;
  try {
    const passwordHash = await hashPassword(password);
    const customer = await createCustomer({
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || undefined,
    });
    customerId = customer.id;

    await recordConsent({
      customerId,
      consentType: "privacy_policy",
      consentTextHash: createHash("sha256").update(PRIVACY_CONSENT_TEXT).digest("hex"),
      policyVersion: PRIVACY_POLICY_VERSION,
      isGranted: true,
      ipAddress: await clientIp(),
    });
  } catch (err) {
    console.error("[auth] registerAction failed:", err);
    return { error: "Не удалось создать аккаунт. Попробуйте позже." };
  }

  await setSessionCookie(customerId, email.toLowerCase());
  redirect("/account");
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export async function loginAction(
  _prev: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  // Throttle brute-force: 10 attempts / 5 min per IP
  const ip = (await clientIp()) ?? "unknown";
  const rl = await rateLimit("login", ip, { limit: 10, windowSec: 300 });
  if (!rl.ok) {
    return { error: `Слишком много попыток входа. Повторите ${retryAfterText(rl.retryAfterSec)}` };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const customer = await getCustomerByEmail(email);
  // Always run verify to keep timing roughly constant against user enumeration
  const ok = await verifyPassword(password, customer?.passwordHash ?? null);

  if (!customer || !customer.isActive || !ok) {
    return { error: "Неверный email или пароль" };
  }

  await touchLastLogin(customer.id);
  await setSessionCookie(customer.id, customer.email);
  redirect("/account");
}

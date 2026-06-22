import "server-only";
import { env } from "@/config/env";

// ---------------------------------------------------------------------------
// YuKassa REST API client
// Docs: https://yookassa.ru/developers/api
// Auth: HTTP Basic — shopId as username, secret key as password
// ---------------------------------------------------------------------------

const YUKASSA_BASE = "https://api.yookassa.ru/v3";

function authHeader(): string {
  const credentials = `${env.YUKASSA_SHOP_ID}:${env.YUKASSA_SECRET_KEY}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

/** Convert kopecks (bigint) to the "XXXX.XX" string YuKassa expects */
function copecksToValue(copecks: bigint): string {
  const rubles = copecks / 100n;
  const cents = copecks % 100n;
  return `${rubles}.${String(cents).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface YukassaAmount {
  value: string; // e.g. "1234.56"
  currency: "RUB";
}

export interface YukassaPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "cancelled";
  amount: YukassaAmount;
  confirmation?: {
    type: "redirect";
    confirmation_url: string;
  };
  payment_method?: {
    type: string;
    id?: string;
    saved?: boolean;
    title?: string;
  };
  captured_at?: string;
  metadata?: Record<string, string>;
  description?: string;
}

// ---------------------------------------------------------------------------
// createYukassaPayment
// ---------------------------------------------------------------------------

export interface CreatePaymentParams {
  amountCopecks: bigint;
  orderId: string;
  orderNumber: string;
  /** URL to redirect the customer after they complete / cancel the payment */
  returnUrl: string;
  /** UUID used as Idempotence-Key header — must be unique per payment attempt */
  idempotencyKey: string;
}

export async function createYukassaPayment(
  params: CreatePaymentParams
): Promise<YukassaPayment> {
  const { amountCopecks, orderId, orderNumber, returnUrl, idempotencyKey } = params;

  const response = await fetch(`${YUKASSA_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotencyKey,
    },
    body: JSON.stringify({
      amount: {
        value: copecksToValue(amountCopecks),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: returnUrl,
      },
      capture: true,
      description: `Заказ ${orderNumber}`,
      metadata: { order_id: orderId },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YuKassa createPayment ${response.status}: ${text}`);
  }

  return response.json() as Promise<YukassaPayment>;
}

// ---------------------------------------------------------------------------
// fetchYukassaPayment — used for webhook signature verification
// ---------------------------------------------------------------------------

export async function fetchYukassaPayment(
  yukassaPaymentId: string
): Promise<YukassaPayment> {
  const response = await fetch(
    `${YUKASSA_BASE}/payments/${yukassaPaymentId}`,
    {
      headers: { Authorization: authHeader() },
      // Disable Next.js fetch cache — we always want live data
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YuKassa fetchPayment ${response.status}: ${text}`);
  }

  return response.json() as Promise<YukassaPayment>;
}

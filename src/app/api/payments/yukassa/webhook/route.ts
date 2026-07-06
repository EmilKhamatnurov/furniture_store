import { NextRequest, NextResponse } from "next/server";
import {
  fetchYukassaPayment,
  processPaymentSucceeded,
  processPaymentCancelled,
  recordWebhookEvent,
  markWebhookProcessed,
  yukassaValueToCopecks,
} from "@/modules/payments";
import { sendPaymentReceivedEmails } from "@/modules/email";

// ---------------------------------------------------------------------------
// POST /api/payments/yukassa/webhook
//
// YuKassa posts a JSON notification when a payment status changes.
// Verification strategy: re-fetch the payment from the YuKassa API.
// This is safer than IP allowlisting and avoids HMAC complexity (YuKassa
// does not sign webhook bodies by default).
//
// Idempotency: externalEventId = "${event}:${payment_id}" — unique index
// in payment_webhook_events prevents double-processing.
// ---------------------------------------------------------------------------

interface YukassaWebhookBody {
  type: string;       // "notification"
  event: string;      // "payment.succeeded" | "payment.cancelled" | …
  object: {
    id: string;       // YuKassa payment UUID
    status: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  // --- 1. Parse body ---
  let body: YukassaWebhookBody;
  try {
    body = (await req.json()) as YukassaWebhookBody;
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const eventType = body.event;
  const yukassaPaymentId = body.object?.id;

  if (!eventType || !yukassaPaymentId) {
    return new NextResponse("Bad Request: missing event or object.id", { status: 400 });
  }

  // Deduplication key — one entry per (event type, payment)
  const externalEventId = `${eventType}:${yukassaPaymentId}`;

  // --- 2. Verify by re-fetching from YuKassa ---
  // The re-fetched object is the AUTHORITATIVE source of truth. We must act on
  // its real `status`, never on the client-supplied `event` field — otherwise
  // anyone who knows a payment id could POST {event:"payment.succeeded"} and
  // mark an order paid without paying.
  let signatureValid: "yes" | "no" = "no";
  let verifiedStatus: string | null = null;
  let verifiedAmountCopecks: bigint | undefined;
  try {
    const verified = await fetchYukassaPayment(yukassaPaymentId);
    verifiedStatus = verified.status;
    verifiedAmountCopecks = yukassaValueToCopecks(verified.amount.value);
    signatureValid = "yes";
  } catch (err) {
    console.warn("[webhook] Could not verify payment with YuKassa:", err);
  }

  // --- 3. Record event (handles duplicates via unique index) ---
  let duplicate = false;
  let eventId: string | null = null;
  try {
    ({ duplicate, eventId } = await recordWebhookEvent({
      externalEventId,
      yukassaPaymentId,
      eventType,
      rawPayload: body,
      signatureValid,
    }));
  } catch (err) {
    console.error("[webhook] Failed to record event:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  if (duplicate) {
    // Already handled — acknowledge so YuKassa stops retrying
    return new NextResponse("OK", { status: 200 });
  }

  // --- 4. Reject unverified events ---
  if (signatureValid === "no") {
    await markWebhookProcessed(externalEventId, "error", "YuKassa verification failed");
    // Return 200 to stop YuKassa retrying (we've logged it)
    return new NextResponse("OK", { status: 200 });
  }

  void eventId; // captured for future use (e.g. BullMQ job payload)

  // --- 5. Process based on the VERIFIED status from YuKassa (not body.event) ---
  try {
    if (verifiedStatus === "succeeded") {
      const { orderId, alreadyProcessed } =
        await processPaymentSucceeded(yukassaPaymentId, verifiedAmountCopecks);
      // Fire confirmation + admin emails only on the first transition to paid
      if (!alreadyProcessed) {
        await sendPaymentReceivedEmails(orderId);
      }
    } else if (verifiedStatus === "canceled" || verifiedStatus === "cancelled") {
      await processPaymentCancelled(yukassaPaymentId);
    } else {
      // pending / waiting_for_capture / other — nothing to do yet, just ack
      console.info(
        `[webhook] No action for verified status "${verifiedStatus}" (event: ${eventType})`
      );
    }

    await markWebhookProcessed(externalEventId, "ok");
  } catch (err) {
    console.error("[webhook] Processing failed:", err);
    await markWebhookProcessed(externalEventId, "error", String(err)).catch(
      (e) => console.error("[webhook] markWebhookProcessed failed:", e)
    );
    // Return 500 so YuKassa retries — our code failed, not the event
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}

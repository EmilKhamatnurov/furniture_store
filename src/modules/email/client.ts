import "server-only";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Unisender Go — transactional email client
// Docs: https://godocs.unisender.ru/web-api-ref#email-send
// Auth: X-API-KEY header. Endpoint returns a per-recipient status array.
// ---------------------------------------------------------------------------

const UNISENDER_ENDPOINT =
  "https://go1.unisender.ru/ru/transactional/api/v1/email/send.json";

const log = logger.child({ module: "email" });

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional tag for analytics & grouping in Unisender dashboard */
  tag?: string | undefined;
}

export interface SendEmailResult {
  /** YuKassa-style: true when accepted by the provider */
  accepted: boolean;
  /** Provider message id, when available */
  messageId?: string | undefined;
}

/**
 * Send a single transactional email through Unisender Go.
 * Throws on transport / API error so BullMQ can retry the job.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, tag } = params;

  // In dev without an API key we don't hit the network — log and succeed.
  if (!env.UNISENDER_API_KEY) {
    log.info(
      { to: maskEmail(to), subject },
      "[email] UNISENDER_API_KEY not set — skipping real send (dev mode)"
    );
    return { accepted: true };
  }

  const body = {
    message: {
      recipients: [{ email: to }],
      subject,
      from_email: env.EMAIL_FROM,
      from_name: env.EMAIL_FROM_NAME,
      body: { html, plaintext: text },
      ...(tag ? { tags: [tag] } : {}),
    },
  };

  const response = await fetch(UNISENDER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": env.UNISENDER_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Unisender send failed ${response.status}: ${errText}`);
  }

  const json = (await response.json()) as {
    status?: string;
    failed_emails?: Record<string, string>;
    emails?: Array<{ email: string; id?: string }>;
  };

  // Unisender returns failed_emails map when some recipients are rejected
  if (json.failed_emails && Object.keys(json.failed_emails).length > 0) {
    throw new Error(`Unisender rejected recipient: ${JSON.stringify(json.failed_emails)}`);
  }

  const messageId = json.emails?.[0]?.id;
  log.info({ to: maskEmail(to), subject, messageId }, "[email] sent");

  return { accepted: true, messageId };
}

/** Mask an email for logs: john.doe@example.com → j***@example.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***@${domain}`;
}

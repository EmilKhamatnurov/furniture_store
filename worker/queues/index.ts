import { Queue } from "bullmq";
import { env } from "@/config/env";

// ---------------------------------------------------------------------------
// BullMQ queue definitions
// Each queue has a dedicated connection per BullMQ's recommendation.
// Workers consume these queues in worker/processors/.
// ---------------------------------------------------------------------------

const connection = { url: env.REDIS_URL };

// Transactional emails: order confirmations, password reset, etc.
export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// SMS notifications (optional — guard with feature flag)
export const smsQueue = new Queue("sms", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
});

// Admin notifications: new order, low stock
export const notificationQueue = new Queue("notification", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 },
  },
});

// ---------------------------------------------------------------------------
// Job payload types
// ---------------------------------------------------------------------------
export interface EmailJobData {
  to: string;
  subject: string;
  // Pre-rendered email body (templates run at enqueue time, where order data
  // is available). Keeps the worker dumb — it only sends what it's given.
  html: string;
  text: string;
  // Optional tag for analytics / grouping in the email provider
  tag?: string;
  // Idempotency hint — used as the BullMQ jobId to avoid duplicate sends
  dedupeKey?: string;
}

export interface SmsJobData {
  // Phone passed as masked string in logs; full stored only in DB
  phone: string;
  message: string;
  orderId?: string;
}

export interface NotificationJobData {
  type: "new_order" | "low_stock" | "payment_failed";
  payload: Record<string, unknown>;
}

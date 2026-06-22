import type { Job } from "bullmq";
import { sendEmail } from "@/modules/email/client";
import { logger } from "@/lib/logger";
import type { EmailJobData } from "@worker/queues";

const log = logger.child({ worker: "email" });

// ---------------------------------------------------------------------------
// Email job processor — sends one pre-rendered email via Unisender Go.
// Throwing causes BullMQ to retry per the queue's backoff policy.
// ---------------------------------------------------------------------------
export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { to, subject, html, text, tag } = job.data;

  log.info({ jobId: job.id, tag, attempt: job.attemptsMade + 1 }, "Processing email job");

  await sendEmail({ to, subject, html, text, tag });

  log.info({ jobId: job.id, tag }, "Email job done");
}

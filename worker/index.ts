import "@worker/bootstrap"; // MUST be first — loads .env.local before env.ts
import { Worker } from "bullmq";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { processEmailJob } from "@worker/processors/email";
import type { EmailJobData } from "@worker/queues";

// ---------------------------------------------------------------------------
// BullMQ worker process — runs separately from the Next.js app.
// Start with: npm run worker
// Each Worker pulls from one queue and processes jobs with the matching
// processor. Concurrency is conservative for a single-VPS deployment.
// ---------------------------------------------------------------------------

const connection = { url: env.REDIS_URL };
const log = logger.child({ process: "worker" });

const workers: Worker[] = [];

// --- Email queue ---
const emailWorker = new Worker<EmailJobData>("email", processEmailJob, {
  connection,
  concurrency: 5,
});
workers.push(emailWorker);

// --- Lifecycle logging per worker ---
for (const w of workers) {
  w.on("completed", (job) => {
    log.debug({ queue: w.name, jobId: job.id }, "Job completed");
  });
  w.on("failed", (job, err) => {
    log.error(
      { queue: w.name, jobId: job?.id, attempts: job?.attemptsMade, err },
      "Job failed"
    );
  });
  w.on("error", (err) => {
    log.error({ queue: w.name, err }, "Worker error");
  });
}

log.info(
  { queues: workers.map((w) => w.name) },
  "🛠  Worker process started"
);

// --- Graceful shutdown ---
async function shutdown(signal: string) {
  log.info({ signal }, "Shutting down workers…");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

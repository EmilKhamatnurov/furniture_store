import pino from "pino";

// ---------------------------------------------------------------------------
// Structured JSON logger (pino)
// 152-FZ: never log full PII — phone, address, full name.
// Redaction list below masks common accidental leaks at the logger level.
// ---------------------------------------------------------------------------

const redactPaths = [
  // Payment data — PCI-DSS
  "*.card_number",
  "*.cvv",
  "*.pan",
  // PII — 152-FZ
  "*.phone",
  "*.address",
  "*.full_name",
  "*.passport",
  "*.inn",
  // Auth
  "*.password",
  "*.token",
  "*.secret",
  "*.api_key",
];

const isDev = process.env["NODE_ENV"] !== "production";

export const logger = isDev
  ? pino({
      level: "debug",
      redact: { paths: redactPaths, censor: "[REDACTED]" },
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    })
  : pino({
      level: "info",
      redact: { paths: redactPaths, censor: "[REDACTED]" },
    });

// ---------------------------------------------------------------------------
// Helper: mask phone — show only last 4 digits
// Use in log calls: logger.info({ phone: maskPhone(raw) }, "SMS sent")
// ---------------------------------------------------------------------------
export function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, "*");
}

// ---------------------------------------------------------------------------
// Child logger factories — attach module context automatically
// ---------------------------------------------------------------------------
export function moduleLogger(module: string) {
  return logger.child({ module });
}

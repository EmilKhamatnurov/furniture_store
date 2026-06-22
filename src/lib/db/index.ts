import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Singleton PostgreSQL connection
// In Next.js dev mode, module is re-evaluated on every hot-reload — we attach
// the client to globalThis to avoid opening a new pool each time.
// ---------------------------------------------------------------------------
const globalForDb = globalThis as unknown as {
  pgClient: postgres.Sql | undefined;
};

const pgClient =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: 10, // connection pool size — sufficient for single-VPS monolith
    idle_timeout: 30,
    connect_timeout: 10,
    transform: {
      // Return JS Date objects for timestamp columns
      undefined: null,
    },
  });

if (env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
}

export const db = drizzle(pgClient, {
  schema,
  logger: env.NODE_ENV === "development",
});

export type Db = typeof db;

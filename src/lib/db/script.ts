import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Database client for standalone scripts (seeds, one-off jobs, migrations).
// Mirrors lib/db/index.ts but without the "server-only" guard so it can be
// imported from tsx scripts that run outside the Next.js runtime.

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env["DATABASE_URL"], { max: 5 });

export const db = drizzle(client, { schema });

// Caller should invoke this when finished to let the process exit cleanly
export async function closeDb() {
  await client.end();
}
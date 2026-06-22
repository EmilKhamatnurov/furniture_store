// ---------------------------------------------------------------------------
// Worker env bootstrap — MUST be the first import in worker/index.ts.
// Next.js auto-loads .env.local for the web app; the standalone worker process
// does not, so we load it here before any module reads `@/config/env`.
//
// ESM evaluates imported modules in source order, depth-first — importing this
// module first guarantees dotenv runs before env.ts validation executes.
// ---------------------------------------------------------------------------
import { config } from "dotenv";

config({ path: ".env.local" });

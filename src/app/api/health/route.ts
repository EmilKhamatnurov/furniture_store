import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// GET /api/health
// Used by Caddy health checks and UptimeRobot
// ---------------------------------------------------------------------------
export async function GET() {
  const checks = await Promise.allSettled([
    db.execute(sql`SELECT 1`),
    redis.ping(),
  ]);

  const dbOk = checks[0]?.status === "fulfilled";
  const redisOk = checks[1]?.status === "fulfilled";
  const allOk = dbOk && redisOk;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks: {
        db: dbOk ? "ok" : "error",
        redis: redisOk ? "ok" : "error",
      },
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}

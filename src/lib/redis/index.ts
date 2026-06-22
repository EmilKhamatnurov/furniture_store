import "server-only";
import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Singleton Redis client — shared between web app and worker process.
// BullMQ requires its own connection instances (see worker/queues/).
// This client is used only for cache reads/writes.
// ---------------------------------------------------------------------------
const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    logger.error({ err }, "Redis client error");
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  return client;
}

export const redis =
  globalForRedis.redisClient ?? createRedisClient();

if (env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redis;
}

// ---------------------------------------------------------------------------
// Cache helpers — thin wrappers around get/set with JSON serialization
// ---------------------------------------------------------------------------

/** Read a cached value; returns null on miss */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

/**
 * Write a value with TTL in seconds.
 * BigInt values are serialized as strings (JSON cannot encode bigint natively).
 * Consumers must re-hydrate bigint fields after read — see catalog/db/cache.ts.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const serialized = JSON.stringify(value, (_k, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  await redis.set(key, serialized, "EX", ttlSeconds);
}

/** Delete a cache key */
export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

// ---------------------------------------------------------------------------
// Cache key factory — keeps key format consistent across modules
// ---------------------------------------------------------------------------
export const CacheKey = {
  product: (slug: string) => `product:${slug}`,
  productList: (categorySlug?: string) =>
    categorySlug ? `products:category:${categorySlug}` : "products:all",
  category: (slug: string) => `category:${slug}`,
  categoryList: () => "categories:all",
  cartSession: (sessionId: string) => `cart:${sessionId}`,
  shippingZones: () => "shipping:zones",
} as const;

export const CACHE_TTL = {
  PRODUCT: 300, // 5 min — catalogue changes infrequently
  CATEGORY: 600, // 10 min
  SHIPPING_ZONES: 3600, // 1 hour — tariff matrix rarely changes
  CART: 86400, // 24 hours — anonymous cart
} as const;

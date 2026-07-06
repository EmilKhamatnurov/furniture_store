import "server-only";
import { db } from "@/lib/db";
import { eq, and, asc, inArray } from "drizzle-orm";
import { shippingZones, shippingTariffs, shippingSettings } from "./db/schema";
import type { ShippingZone, ShippingTariff } from "./db/schema";

// ---------------------------------------------------------------------------
// Shipping repository — zones, tariffs, settings.
// Queries are small and infrequent (once per checkout/quote), so no caching.
// ---------------------------------------------------------------------------

const DIVISOR_KEY = "volumetric_divisor";
const DEFAULT_DIVISOR = 5000;

export type ZoneWithTariffs = ShippingZone & { tariffs: ShippingTariff[] };

// ---- Public reads (active only) -------------------------------------------

export async function getActiveZonesWithTariffs(): Promise<ZoneWithTariffs[]> {
  const zones = await db.query.shippingZones.findMany({
    where: eq(shippingZones.isActive, true),
    orderBy: [asc(shippingZones.sortOrder), asc(shippingZones.name)],
  });
  return attachTariffs(zones, true);
}

export async function getZoneWithTariffs(
  zoneId: string
): Promise<ZoneWithTariffs | null> {
  const zone = await db.query.shippingZones.findFirst({
    where: and(eq(shippingZones.id, zoneId), eq(shippingZones.isActive, true)),
  });
  if (!zone) return null;
  const [withTariffs] = await attachTariffs([zone], true);
  return withTariffs ?? null;
}

export async function getVolumetricDivisor(): Promise<number> {
  const row = await db.query.shippingSettings.findFirst({
    where: eq(shippingSettings.key, DIVISOR_KEY),
  });
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DIVISOR;
}

// ---- Admin reads (include inactive) ---------------------------------------

export async function listAllZonesWithTariffs(): Promise<ZoneWithTariffs[]> {
  const zones = await db.query.shippingZones.findMany({
    orderBy: [asc(shippingZones.sortOrder), asc(shippingZones.name)],
  });
  return attachTariffs(zones, false);
}

// ---- Admin writes ---------------------------------------------------------

export async function createZone(input: {
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<ShippingZone> {
  const [zone] = await db.insert(shippingZones).values(input).returning();
  if (!zone) throw new Error("Zone insert returned no rows");
  return zone;
}

export async function updateZone(
  id: string,
  input: { name: string; description: string | null; sortOrder: number; isActive: boolean }
): Promise<void> {
  await db.update(shippingZones).set(input).where(eq(shippingZones.id, id));
}

export async function addTariff(input: {
  zoneId: string;
  maxWeightKg: number;
  priceCopecks: bigint;
  extraPerKgCopecks: bigint;
}): Promise<void> {
  await db.insert(shippingTariffs).values({ ...input, isActive: true });
}

export async function updateTariff(
  id: string,
  input: { maxWeightKg: number; priceCopecks: bigint; extraPerKgCopecks: bigint; isActive: boolean }
): Promise<void> {
  await db.update(shippingTariffs).set(input).where(eq(shippingTariffs.id, id));
}

export async function deleteTariff(id: string): Promise<void> {
  await db.delete(shippingTariffs).where(eq(shippingTariffs.id, id));
}

export async function setVolumetricDivisor(divisor: number): Promise<void> {
  const existing = await db.query.shippingSettings.findFirst({
    where: eq(shippingSettings.key, DIVISOR_KEY),
  });
  if (existing) {
    await db
      .update(shippingSettings)
      .set({ value: String(divisor), updatedAt: new Date() })
      .where(eq(shippingSettings.id, existing.id));
  } else {
    await db.insert(shippingSettings).values({ key: DIVISOR_KEY, value: String(divisor) });
  }
}

// ---- helpers --------------------------------------------------------------

async function attachTariffs(
  zones: ShippingZone[],
  activeOnly: boolean
): Promise<ZoneWithTariffs[]> {
  if (zones.length === 0) return [];

  const zoneIds = zones.map((z) => z.id);
  const tariffs = await db.query.shippingTariffs.findMany({
    where: activeOnly
      ? and(inArray(shippingTariffs.zoneId, zoneIds), eq(shippingTariffs.isActive, true))
      : inArray(shippingTariffs.zoneId, zoneIds),
    orderBy: [asc(shippingTariffs.maxWeightKg)],
  });

  const byZone = new Map<string, ShippingTariff[]>();
  for (const t of tariffs) {
    const list = byZone.get(t.zoneId) ?? [];
    list.push(t);
    byZone.set(t.zoneId, list);
  }

  return zones.map((zone) => ({ ...zone, tariffs: byZone.get(zone.id) ?? [] }));
}

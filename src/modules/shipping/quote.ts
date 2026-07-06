import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { productVariants } from "@/modules/catalog/db/schema";
import {
  lineChargeableKg,
  totalChargeableKg,
  computeShippingCopecks,
  type ItemDimensions,
} from "./calculate";
import { getZoneWithTariffs, getVolumetricDivisor } from "./repository";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// quoteShipping — authoritative server-side shipping price for a cart + zone.
// Dimensions come from the DB (variant overrides product), never the client.
// ---------------------------------------------------------------------------

export interface QuoteInput {
  variantId: string;
  quantity: number;
}

export interface ShippingQuote {
  zoneId: string;
  zoneName: string;
  totalKg: number;
  /** null = zone has no tariffs / cannot be calculated */
  shippingCopecks: bigint | null;
}

export async function quoteShipping(
  items: QuoteInput[],
  zoneId: string
): Promise<ShippingQuote | null> {
  const zone = await getZoneWithTariffs(zoneId);
  if (!zone) return null;

  const ids = items.map((i) => i.variantId).filter(Boolean);
  if (ids.length === 0) {
    return { zoneId, zoneName: zone.name, totalKg: 0, shippingCopecks: 0n };
  }

  const [variants, divisor] = await Promise.all([
    db.query.productVariants.findMany({
      where: inArray(productVariants.id, ids),
      with: { product: true },
    }),
    getVolumetricDivisor(),
  ]);

  const byId = new Map(variants.map((v) => [v.id, v]));

  const dims: ItemDimensions[] = [];
  for (const item of items) {
    const v = byId.get(item.variantId);
    if (!v) {
      // Variant gone — refuse to quote rather than silently undercharge
      logger.warn(
        { variantId: item.variantId, zoneId },
        "[shipping] cart references a missing variant — cannot quote"
      );
      return { zoneId, zoneName: zone.name, totalKg: 0, shippingCopecks: null };
    }
    const p = v.product;
    const d: ItemDimensions = {
      lengthCm: v.lengthCm ?? p.lengthCm,
      widthCm: v.widthCm ?? p.widthCm,
      heightCm: v.heightCm ?? p.heightCm,
      weightGrams: v.weightGrams ?? p.weightGrams,
      quantity: Math.max(1, item.quantity),
    };
    // No weight AND no volume means the admin never filled the dimensions in —
    // quoting would always hit the cheapest bracket and undercharge furniture.
    if (lineChargeableKg(d, divisor) <= 0) {
      logger.warn(
        { variantId: item.variantId, productId: p.id },
        "[shipping] product has no dimensions/weight — cannot quote"
      );
      return { zoneId, zoneName: zone.name, totalKg: 0, shippingCopecks: null };
    }
    dims.push(d);
  }

  const totalKg = totalChargeableKg(dims, divisor);
  const shippingCopecks = computeShippingCopecks(
    totalKg,
    zone.tariffs.map((t) => ({
      maxWeightKg: t.maxWeightKg,
      priceCopecks: t.priceCopecks,
      extraPerKgCopecks: t.extraPerKgCopecks,
    }))
  );

  return { zoneId, zoneName: zone.name, totalKg, shippingCopecks };
}

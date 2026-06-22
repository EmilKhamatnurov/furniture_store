// ---------------------------------------------------------------------------
// Shipping cost calculation — pure functions (no I/O), safe to unit-test.
//
// Chargeable weight per unit = max(actual weight, volumetric weight), where
// volumetric weight (kg) = L*W*H (cm) / divisor (default 5000, courier standard).
// Order shipping = tariff bracket for the total chargeable weight in the zone.
// ---------------------------------------------------------------------------

export interface ItemDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightGrams: number;
  quantity: number;
}

export interface TariffBracket {
  maxWeightKg: number;
  priceCopecks: bigint;
  extraPerKgCopecks: bigint;
}

/** Chargeable weight (kg) for a single line item × its quantity. */
export function lineChargeableKg(dim: ItemDimensions, divisor: number): number {
  const volumetricKg =
    divisor > 0 ? (dim.lengthCm * dim.widthCm * dim.heightCm) / divisor : 0;
  const actualKg = dim.weightGrams / 1000;
  return Math.max(volumetricKg, actualKg) * dim.quantity;
}

/** Total chargeable weight (kg) across all items. */
export function totalChargeableKg(items: ItemDimensions[], divisor: number): number {
  return items.reduce((sum, it) => sum + lineChargeableKg(it, divisor), 0);
}

/**
 * Shipping price for a given total weight against a zone's tariff brackets.
 * Returns null when the zone has no tariffs configured.
 */
export function computeShippingCopecks(
  totalKg: number,
  tariffs: TariffBracket[]
): bigint | null {
  if (tariffs.length === 0) return null;

  const sorted = [...tariffs].sort((a, b) => a.maxWeightKg - b.maxWeightKg);

  // Smallest bracket that covers the weight
  const bracket = sorted.find((t) => totalKg <= t.maxWeightKg);
  if (bracket) return bracket.priceCopecks;

  // Heavier than the largest bracket → last bracket + per-kg surcharge
  const last = sorted[sorted.length - 1]!;
  const extraKg = Math.ceil(totalKg - last.maxWeightKg);
  return last.priceCopecks + last.extraPerKgCopecks * BigInt(Math.max(0, extraKg));
}

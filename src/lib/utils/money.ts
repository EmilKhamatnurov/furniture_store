// ---------------------------------------------------------------------------
// Money utilities
// Domain rule: ALL monetary values are stored and passed as bigint (kopecks).
// Conversion to rubles happens ONLY at the UI render boundary.
// ---------------------------------------------------------------------------

/**
 * Format kopecks as a human-readable RUB string: 150000n → "1 500 ₽".
 * Whole-ruble amounts show no decimals; otherwise exactly 2 ("999,50 ₽",
 * never "999,5 ₽").
 */
export function formatRub(kopecks: bigint): string {
  const rubles = Number(kopecks) / 100;
  const fractionDigits = kopecks % 100n === 0n ? 0 : 2;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rubles);
}

/** Convert a float/string ruble value from user input to kopecks bigint */
export function rubToKopecks(rubles: number): bigint {
  // Round to avoid floating-point artifacts: 99.99 → 9999
  return BigInt(Math.round(rubles * 100));
}

/** Convert kopecks bigint to number for external APIs that expect floats */
export function kopecksToRubFloat(kopecks: bigint): number {
  return Number(kopecks) / 100;
}

/** Add two kopeck amounts safely */
export function addKopecks(a: bigint, b: bigint): bigint {
  return a + b;
}

/** Multiply kopecks by an integer quantity */
export function multiplyKopecks(amount: bigint, qty: number): bigint {
  return amount * BigInt(qty);
}

/** Kopecks brand type — use this in function signatures for clarity */
export type Kopecks = bigint & { readonly _brand: "Kopecks" };

export function asKopecks(n: bigint): Kopecks {
  if (n < 0n) throw new RangeError("Kopecks cannot be negative");
  return n as Kopecks;
}

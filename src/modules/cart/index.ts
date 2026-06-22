// ---------------------------------------------------------------------------
// Cart module — public API
// Other modules must import from this barrel, never from internals.
// ---------------------------------------------------------------------------

export { CartProvider, useCart } from "./store";
export type { CartItem } from "./types";

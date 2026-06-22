"use client";

import { useEffect } from "react";
import { useCart } from "@/modules/cart";

// ---------------------------------------------------------------------------
// CartClearer — clears localStorage cart after successful order creation.
// Runs client-side on mount so it doesn't block server rendering.
// ---------------------------------------------------------------------------
export function CartClearer() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}

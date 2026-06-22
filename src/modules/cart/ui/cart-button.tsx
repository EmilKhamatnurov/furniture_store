"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "../store";

// ---------------------------------------------------------------------------
// CartButton — rendered in SiteHeader (server component).
// Wrapping this in "use client" lets it read cart state from context while
// keeping the rest of the header as a server component.
// ---------------------------------------------------------------------------
export function CartButton() {
  const { totalItems, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label={
        totalItems > 0
          ? `Корзина, ${totalItems} ${pluralizeItems(totalItems)}`
          : "Корзина"
      }
      className="inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Корзина</span>
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background/20 px-1.5 text-xs font-semibold tabular-nums leading-none">
        {totalItems > 99 ? "99+" : totalItems}
      </span>
    </button>
  );
}

function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "товара";
  return "товаров";
}

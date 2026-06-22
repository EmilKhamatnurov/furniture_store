"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "../store";
import { CartItemRow } from "./cart-item-row";
import { formatRub } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { urls } from "@/lib/utils/urls";

// ---------------------------------------------------------------------------
// CartDrawer — Radix Dialog styled as a right-side sheet.
// Opened via CartContext.openCart() or automatically when addItem() is called.
// ---------------------------------------------------------------------------
export function CartDrawer() {
  const { items, isOpen, closeCart, totalCopecks, totalItems, clearCart } =
    useCart();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />

        {/* Panel */}
        <Dialog.Content
          className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-background shadow-2xl flex flex-col outline-none"
          aria-label="Корзина"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Dialog.Title className="font-serif text-xl font-semibold tracking-tight">
              Корзина
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {totalItems} {pluralizeItems(totalItems)}
                </span>
              )}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Закрыть корзину"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Items / Empty state */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  В корзине пока ничего нет
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={urls.catalog()} onClick={closeCart}>
                    Перейти в каталог
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <CartItemRow key={item.variantId} item={item} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-5 py-5 border-t border-border space-y-4 bg-background">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatRub(totalCopecks)}
                </span>
              </div>

              <Button size="lg" className="w-full" asChild>
                <Link href={urls.checkout()} onClick={closeCart}>
                  Оформить заказ
                </Link>
              </Button>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
              >
                Очистить корзину
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// Russian pluralisation for "товар"
// ---------------------------------------------------------------------------
function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "товара";
  return "товаров";
}

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/modules/cart";
import { CartItemRow } from "@/modules/cart/ui/cart-item-row";
import { formatRub } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { urls } from "@/lib/utils/urls";

export function CartPageClient() {
  const { items, totalCopecks, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/25" />
        <div className="space-y-2">
          <p className="text-xl font-medium">Корзина пуста</p>
          <p className="text-muted-foreground text-sm">
            Добавьте товары из каталога
          </p>
        </div>
        <Button asChild>
          <Link href={urls.catalog()}>Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
      {/* Items list */}
      <div>
        <ul className="divide-y divide-border border-t border-border">
          {items.map((item) => (
            <CartItemRow key={item.variantId} item={item} />
          ))}
        </ul>
        <button
          onClick={clearCart}
          className="mt-4 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Очистить корзину
        </button>
      </div>

      {/* Order summary */}
      <div className="rounded-lg border border-border p-6 space-y-5 lg:sticky lg:top-24">
        <h2 className="font-semibold text-lg">Сумма заказа</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Товары</span>
            <span className="tabular-nums">{formatRub(totalCopecks)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Доставка</span>
            <span className="text-muted-foreground text-xs leading-5">
              рассчитывается при оформлении
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-between font-semibold text-base">
          <span>К оплате</span>
          <span className="tabular-nums">{formatRub(totalCopecks)}</span>
        </div>

        <Button size="lg" className="w-full" asChild>
          <Link href={urls.checkout()}>Оформить заказ</Link>
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Оплата картой или СБП после подтверждения заказа
        </p>
      </div>
    </div>
  );
}

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
      <div className="flex flex-col items-center gap-6 border-y border-border py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-pine/45" />
        <div className="space-y-2">
          <p className="font-serif text-3xl">Корзина пуста</p>
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
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      {/* Items list */}
      <div>
        <div className="mb-5 flex items-baseline justify-between border-b border-border pb-4">
          <p className="eyebrow">Выбранные предметы</p>
          <p className="text-sm text-muted-foreground">{items.length} поз.</p>
        </div>
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
      <div className="space-y-5 border-y border-border bg-card p-6 lg:sticky lg:top-24 lg:p-8">
        <p className="eyebrow text-pine">Сумма заказа</p>

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

        <div className="flex justify-between border-t border-border pt-5 font-semibold text-base">
          <span>К оплате</span>
          <span className="tabular-nums">{formatRub(totalCopecks)}</span>
        </div>

        <Button size="lg" className="w-full" asChild>
          <Link href={urls.checkout()}>Оформить заказ</Link>
        </Button>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Test/demo: финальная оплата и юридические условия будут добавлены перед production.
        </p>
      </div>
    </div>
  );
}

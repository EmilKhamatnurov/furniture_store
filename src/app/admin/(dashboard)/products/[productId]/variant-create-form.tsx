"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVariantAction } from "../../actions";

export function VariantCreateForm({ productId }: { productId: string }) {
  const [state, action, isPending] = useActionState(createVariantAction, null);
  return (
    <form action={action} className="grid gap-3 rounded-md border border-dashed border-border p-4 md:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      <div>
        <label className="text-xs text-muted-foreground">Название варианта</label>
        <Input name="label" required className="mt-1" placeholder="Натуральный дуб" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">SKU</label>
        <Input name="sku" required className="mt-1" placeholder="TV-1600-NAT" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Цена, ₽ <span className="normal-case">(пусто = базовая)</span></label>
        <Input name="priceRub" type="number" min="0" step="1" className="mt-1" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Остаток</label>
        <Input name="stockQuantity" type="number" min="0" step="1" required defaultValue="0" className="mt-1" />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-muted-foreground">Параметры — одна строка на значение</label>
        <textarea name="optionsText" required rows={3} placeholder={"Цвет: Натуральный\nМатериал: Шпон дуба"} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-input" /> Активен</label>
      <div className="flex items-center gap-3"><Button type="submit" size="sm" disabled={isPending}>{isPending ? "Добавляем…" : "Добавить SKU"}</Button>{state?.success && <span className="text-xs text-green-600">Добавлено</span>}</div>
      {state?.error && <p className="text-xs text-destructive md:col-span-2">{state.error}</p>}
    </form>
  );
}

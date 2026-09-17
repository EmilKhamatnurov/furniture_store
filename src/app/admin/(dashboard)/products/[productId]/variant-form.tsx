"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateVariantAction } from "../../actions";
import { formatVariantOptions } from "@/modules/catalog/domain/variant-options";

interface VariantFormProps {
  variantId: string;
  productId: string;
  label: string;
  sku: string;
  priceRub: string; // "" when inheriting base price
  stockQuantity: number;
  isActive: boolean;
  options: Array<{ name: string; value: string }>;
}

export function VariantForm(props: VariantFormProps) {
  const [state, action, isPending] = useActionState(updateVariantAction, null);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-md border border-border px-3 py-3"
    >
      <input type="hidden" name="variantId" value={props.variantId} />
      <input type="hidden" name="productId" value={props.productId} />

      <div className="flex-1 min-w-[140px]">
        <p className="text-sm font-medium">{props.label}</p>
        <p className="text-xs text-muted-foreground">SKU {props.sku}</p>
      </div>

      <label className="w-full text-xs text-muted-foreground">
        Параметры — одна строка на значение
        <textarea
          name="optionsText"
          rows={2}
          defaultValue={formatVariantOptions(props.options)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </label>

      <label className="text-xs text-muted-foreground">
        Цена, ₽ (пусто = базовая)
        <Input
          name="priceRub"
          type="number"
          min="0"
          step="1"
          defaultValue={props.priceRub}
          className="mt-1 h-9 w-28"
          placeholder="базовая"
        />
      </label>

      <label className="text-xs text-muted-foreground">
        Остаток
        <Input
          name="stockQuantity"
          type="number"
          min="0"
          step="1"
          defaultValue={props.stockQuantity}
          className="mt-1 h-9 w-20"
          required
        />
      </label>

      <label className="flex items-center gap-1.5 text-xs pb-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={props.isActive}
          className="h-4 w-4 rounded border-input"
        />
        Активен
      </label>

      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "…" : "Сохранить"}
      </Button>

      {state?.error && (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      )}
      {state?.success && <p className="w-full text-xs text-green-600">Сохранено</p>}
    </form>
  );
}

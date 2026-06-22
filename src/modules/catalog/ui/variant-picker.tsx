"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { formatRub } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { getVariantPrice } from "@/modules/catalog/domain";
import type { Product, ProductVariant } from "@/modules/catalog/db/schema";
import { useCart } from "@/modules/cart";

interface VariantPickerProps {
  product: Pick<Product, "id" | "name" | "basePriceCopecks">;
  variants: ProductVariant[];
  /** S3 key for the primary product image — snapshotted into the cart item */
  primaryImageS3Key?: string | null;
}

// ---------------------------------------------------------------------------
// Variant picker — groups options by name (Wood / Upholstery / Size)
// and lets user select one value per group. Resolves to a unique variant.
// "Add to cart" is a placeholder until cart module ships.
// ---------------------------------------------------------------------------
export function VariantPicker({
  product,
  variants,
  primaryImageS3Key = null,
}: VariantPickerProps) {
  const { addItem } = useCart();
  // Build option groups: { "Дерево": ["Дуб", "Орех"], "Обивка": [...] }
  const optionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const opt of v.options) {
        if (!groups.has(opt.name)) groups.set(opt.name, new Set());
        groups.get(opt.name)!.add(opt.value);
      }
    }
    return Array.from(groups.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);

  // Initialize selection with first variant's options
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const first = variants[0];
    if (first) {
      for (const opt of first.options) init[opt.name] = opt.value;
    }
    return init;
  });

  // Find variant matching all selected options
  const matchingVariant = useMemo(() => {
    return variants.find((v) =>
      v.options.every((opt) => selected[opt.name] === opt.value)
    );
  }, [variants, selected]);

  const isOutOfStock =
    !matchingVariant || matchingVariant.stockQuantity <= 0;

  const price = matchingVariant
    ? getVariantPrice(product, matchingVariant)
    : product.basePriceCopecks;

  function handleAddToCart() {
    if (!matchingVariant) return;
    addItem({
      variantId: matchingVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: matchingVariant.label,
      sku: matchingVariant.sku,
      imageS3Key: primaryImageS3Key,
      priceCopecks: price,
      quantity: 1,
    });
  }

  return (
    <div className="space-y-6">
      {optionGroups.map((group) => (
        <div key={group.name}>
          <div className="text-sm font-medium mb-2">
            {group.name}:{" "}
            <span className="text-muted-foreground">
              {selected[group.name]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isActive = selected[group.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setSelected((s) => ({ ...s, [group.name]: value }))
                  }
                  className={cn(
                    "px-4 py-2 text-sm rounded-md border transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:border-primary/50"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Цена:</span>
          <span className="text-2xl font-semibold">{formatRub(price)}</span>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingBag className="h-4 w-4" />
          {isOutOfStock ? "Нет в наличии" : "В корзину"}
        </Button>

        {matchingVariant && matchingVariant.stockQuantity > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Артикул: {matchingVariant.sku}
          </p>
        )}
      </div>
    </div>
  );
}

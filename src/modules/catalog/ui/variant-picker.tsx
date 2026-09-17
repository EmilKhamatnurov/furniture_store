"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  // A shareable SKU query restores a configuration when a visitor returns.
  // Fall back to the first in-stock fixture instead of a dead-end variant.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const requestedSku = searchParams.get("sku");
    const first =
      variants.find((variant) => variant.sku === requestedSku && variant.stockQuantity > 0) ??
      variants.find((variant) => variant.stockQuantity > 0) ??
      variants[0];
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

  function isOptionAvailable(groupName: string, value: string) {
    return variants.some(
      (variant) =>
        variant.stockQuantity > 0 &&
        variant.options.every(
          (option) =>
            option.name === groupName
              ? option.value === value
              : selected[option.name] === option.value
        )
    );
  }

  function selectOption(groupName: string, value: string) {
    // A change on one axis can make a previous combination invalid. Resolve to
    // the closest sellable configuration instead of leaving a dead-end state.
    const candidate = variants
      .filter((variant) =>
        variant.stockQuantity > 0 &&
        variant.options.some(
          (option) => option.name === groupName && option.value === value
        )
      )
      .sort((a, b) => {
        const score = (variant: ProductVariant) =>
          variant.options.filter(
            (option) => option.name !== groupName && selected[option.name] === option.value
          ).length;
        return score(b) - score(a);
      })[0] ?? variants.find((variant) =>
        variant.options.some((option) => option.name === groupName && option.value === value)
      );

    if (!candidate) return;
    setSelected(Object.fromEntries(candidate.options.map((option) => [option.name, option.value])));
    const params = new URLSearchParams(searchParams.toString());
    params.set("sku", candidate.sku);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

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
      stockQuantity: matchingVariant.stockQuantity,
      quantity: 1,
    });
  }

  return (
    <div className="space-y-7 border-y border-border py-7">
      {optionGroups.map((group) => (
        <div key={group.name}>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.1em]">
              {group.name}
            </span>
            <span className="text-sm text-muted-foreground">{selected[group.name]}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {group.values.map((value) => {
              const isActive = selected[group.name] === value;
              const isAvailable = isOptionAvailable(group.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectOption(group.name, value)}
                  aria-pressed={isActive}
                  disabled={!isAvailable}
                  className={cn(
                    "border px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/50 disabled:text-muted-foreground/45 sm:px-4",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card hover:border-pine hover:text-pine"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-4 pt-1">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Тестовая цена</span>
          <span className="font-serif text-3xl">{formatRub(price)}</span>
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
          <p className="text-center text-xs text-muted-foreground">
            В наличии: {matchingVariant.stockQuantity} шт. · SKU {matchingVariant.sku}
          </p>
        )}
      </div>
    </div>
  );
}

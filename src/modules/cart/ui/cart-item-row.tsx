"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../store";
import type { CartItem } from "../types";
import { formatRub } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { removeItem, setQuantity } = useCart();

  return (
    <li className="flex gap-5 py-5">
      {/* Thumbnail */}
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden bg-muted sm:h-28 sm:w-24">
        <Image
          src={imageUrl(item.imageS3Key)}
          alt={item.productName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-lg leading-snug">
              {item.productName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.variantLabel}
            </p>
          </div>
          <button
            onClick={() => removeItem(item.variantId)}
            aria-label={`Удалить ${item.productName}`}
            className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          {/* Quantity stepper */}
          <div className="flex items-center border border-border bg-card">
            <button
              onClick={() => setQuantity(item.variantId, item.quantity - 1)}
              aria-label="Уменьшить количество"
              className="flex h-8 w-8 items-center justify-center hover:bg-muted transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
              aria-label="Увеличить количество"
              disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/35"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <p className="text-sm font-semibold tabular-nums">
            {formatRub(item.priceCopecks * BigInt(item.quantity))}
          </p>
        </div>
      </div>
    </li>
  );
}

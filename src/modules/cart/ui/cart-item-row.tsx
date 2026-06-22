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
    <li className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
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
            <p className="text-sm font-medium leading-snug truncate">
              {item.productName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.variantLabel}
            </p>
          </div>
          <button
            onClick={() => removeItem(item.variantId)}
            aria-label={`Удалить ${item.productName}`}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() => setQuantity(item.variantId, item.quantity - 1)}
              aria-label="Уменьшить количество"
              className="flex h-7 w-7 items-center justify-center hover:bg-muted transition-colors rounded-l-md"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
              aria-label="Увеличить количество"
              className="flex h-7 w-7 items-center justify-center hover:bg-muted transition-colors rounded-r-md"
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

import Image from "next/image";
import Link from "next/link";
import { getMinVariantPrice, isProductInStock } from "@/modules/catalog/domain";
import type { ProductWithRelations } from "@/modules/catalog/domain";
import { formatRub } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

interface ProductCardProps {
  product: ProductWithRelations;
}

// ---------------------------------------------------------------------------
// Product card — used on category listings and home page
// Server component, no client JS needed
// ---------------------------------------------------------------------------
export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images[0];
  const usesSourceCardImage = primaryImage?.s3Key.startsWith(
    "catalog/source-2026-09-18/"
  );
  const minPrice = getMinVariantPrice(product);
  const inStock = isProductInStock(product);
  const hasMultiplePrices =
    new Set(
      product.variants.map(
        (v) => v.priceCopecks ?? product.basePriceCopecks
      )
    ).size > 1;

  return (
    <Link
      href={urls.product(product.category.slug, product.slug)}
      className="group block"
    >
      <article className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Image
            src={imageUrl(primaryImage?.s3Key)}
            alt={primaryImage?.altText ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={
              usesSourceCardImage
                ? "origin-top object-cover scale-[1.42] transition-transform duration-700 group-hover:scale-[1.46]"
                : "object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            }
          />
          {!inStock && (
            <span className="absolute left-3 top-3 bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
              Под заказ
            </span>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="eyebrow">{product.category.name}</p>
          <h3 className="font-serif text-xl font-normal leading-snug group-hover:text-pine transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-base font-semibold tabular-nums">
              {hasMultiplePrices && (
                <span className="text-sm font-normal text-muted-foreground">
                  от{" "}
                </span>
              )}
              {formatRub(minPrice)}
            </p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  inStock ? "bg-pine" : "bg-muted-foreground/50"
                }`}
              />
              {inStock ? "В наличии" : "Под заказ"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

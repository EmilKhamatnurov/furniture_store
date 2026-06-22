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
      <article className="space-y-3.5">
        <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
          <Image
            src={imageUrl(primaryImage?.s3Key)}
            alt={primaryImage?.altText ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {!inStock && (
            <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">
              Под заказ
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="eyebrow">{product.category.name}</p>
          <h3 className="font-serif text-lg font-medium leading-snug group-hover:text-muted-foreground transition-colors">
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
                  inStock ? "bg-emerald-600" : "bg-muted-foreground/50"
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

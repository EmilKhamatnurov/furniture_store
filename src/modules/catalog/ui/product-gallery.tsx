"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { imageUrl } from "@/lib/utils/images";
import type { ProductImage } from "@/modules/catalog/db/schema";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

// ---------------------------------------------------------------------------
// Product gallery — minimal client-side state for the thumbnail picker.
// The main image is still <Image> so it benefits from Next's optimization.
// ---------------------------------------------------------------------------
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Fallback to placeholder when no images uploaded yet
  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={imageUrl(null)}
          alt={productName}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  const active = images[activeIdx] ?? images[0]!;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={imageUrl(active.s3Key)}
          alt={active.altText ?? productName}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Показать изображение ${i + 1}`}
              aria-current={i === activeIdx}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md bg-muted transition-all",
                i === activeIdx
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={imageUrl(img.s3Key)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

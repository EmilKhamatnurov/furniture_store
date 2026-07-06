"use client";

import { useActionState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageUrl } from "@/lib/utils/images";
import {
  uploadProductImagesAction,
  deleteProductImageAction,
  makePrimaryProductImageAction,
  moveProductImageAction,
  updateProductImageAltAction,
} from "../../actions";

interface AdminProductImage {
  id: string;
  s3Key: string;
  altText: string | null;
}

interface ProductImagesProps {
  productId: string;
  images: AdminProductImage[];
}

export function ProductImages({ productId, images }: ProductImagesProps) {
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadProductImagesAction,
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear the file input after a successful upload
  useEffect(() => {
    if (uploadState?.success && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadState]);

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Фотографий пока нет — покупатели видят плейсхолдер.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              productId={productId}
              isPrimary={i === 0}
              isLast={i === images.length - 1}
            />
          ))}
        </div>
      )}

      <form action={uploadAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input
          ref={fileInputRef}
          type="file"
          name="images"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-muted/80"
        />
        <Button type="submit" size="sm" disabled={isUploading}>
          <Upload className="mr-1.5 h-4 w-4" />
          {isUploading ? "Загрузка…" : "Загрузить"}
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          JPEG, PNG, WebP или AVIF, до 5 МБ, до 8 файлов за раз. Первое фото —
          главное (обложка в каталоге).
        </p>
        {uploadState?.error && (
          <p className="w-full text-xs text-destructive">{uploadState.error}</p>
        )}
        {uploadState?.success && (
          <p className="w-full text-xs text-green-600">Фотографии загружены</p>
        )}
      </form>
    </div>
  );
}

function ImageCard({
  image,
  productId,
  isPrimary,
  isLast,
}: {
  image: AdminProductImage;
  productId: string;
  isPrimary: boolean;
  isLast: boolean;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProductImageAction,
    null
  );
  const [, primaryAction] = useActionState(makePrimaryProductImageAction, null);
  const [, moveAction, isMoving] = useActionState(moveProductImageAction, null);
  const [altState, altAction, isSavingAlt] = useActionState(
    updateProductImageAltAction,
    null
  );

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="group relative aspect-square bg-muted">
        <Image
          src={imageUrl(image.s3Key)}
          alt={image.altText ?? ""}
          fill
          sizes="(min-width: 1024px) 240px, 50vw"
          className="object-cover"
        />

        {isPrimary && (
          <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            Главное
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="flex gap-1">
            <form action={moveAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="direction" value="up" />
              <IconButton
                title="Левее (ближе к обложке)"
                disabled={isPrimary || isMoving}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </IconButton>
            </form>
            <form action={moveAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="direction" value="down" />
              <IconButton title="Правее" disabled={isLast || isMoving}>
                <ChevronRight className="h-3.5 w-3.5" />
              </IconButton>
            </form>
          </div>
          <div className="flex gap-1">
            {!isPrimary && (
              <form action={primaryAction}>
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="productId" value={productId} />
                <IconButton title="Сделать главным">
                  <Star className="h-3.5 w-3.5" />
                </IconButton>
              </form>
            )}
            <form action={deleteAction}>
              <input type="hidden" name="imageId" value={image.id} />
              <input type="hidden" name="productId" value={productId} />
              <IconButton
                title="Удалить фото"
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </form>
          </div>
        </div>
      </div>

      <form action={altAction} className="flex items-center gap-1.5 p-1.5">
        <input type="hidden" name="imageId" value={image.id} />
        <input type="hidden" name="productId" value={productId} />
        <Input
          name="altText"
          defaultValue={image.altText ?? ""}
          placeholder="alt-текст (для SEO)"
          maxLength={300}
          className="h-8 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={isSavingAlt}
          className="h-8 shrink-0 px-2 text-xs"
        >
          {isSavingAlt ? "…" : altState?.success ? "✓" : "OK"}
        </Button>
      </form>
      {deleteState?.error && (
        <p className="px-1.5 pb-1.5 text-[10px] text-destructive">
          {deleteState.error}
        </p>
      )}
    </div>
  );
}

function IconButton({
  children,
  title,
  disabled,
  className,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      className={`rounded bg-white/90 p-1.5 text-foreground hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

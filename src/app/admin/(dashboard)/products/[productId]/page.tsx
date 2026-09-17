import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProductAdmin, listCategoriesAdmin } from "@/modules/admin";
import { ProductForm } from "./product-form";
import { VariantForm } from "./variant-form";
import { ProductImages } from "./product-images";
import { VariantCreateForm } from "./variant-create-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function AdminProductEditPage({ params }: PageProps) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([
    getProductAdmin(productId),
    listCategoriesAdmin(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Все товары
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold">{product.name}</h1>
        {product.isActive && !product.isArchived && (
          <Link
            href={`/catalog/${product.category.slug}/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            На сайте <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Основное
        </h2>
        <ProductForm
          productId={product.id}
          name={product.name}
          description={product.description ?? ""}
          priceRub={Number(product.basePriceCopecks) / 100}
          categoryId={product.categoryId}
          isActive={product.isActive}
          isArchived={product.isArchived}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>

      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Фотографии ({product.images.length})
        </h2>
        <ProductImages
          productId={product.id}
          images={product.images.map((img) => ({
            id: img.id,
            s3Key: img.s3Key,
            altText: img.altText,
          }))}
        />
      </section>

      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Варианты ({product.variants.length})
        </h2>
        {product.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Вариантов нет</p>
        ) : (
          <div className="space-y-3">
            {product.variants.map((v) => (
              <VariantForm
                key={v.id}
                variantId={v.id}
                productId={product.id}
                label={v.label}
                sku={v.sku}
                priceRub={v.priceCopecks != null ? String(Number(v.priceCopecks) / 100) : ""}
                stockQuantity={v.stockQuantity}
                isActive={v.isActive}
                options={v.options}
              />
            ))}
            </div>
        )}
        <div className="mt-4">
          <h3 className="mb-3 text-sm font-medium">Добавить вариант</h3>
          <VariantCreateForm productId={product.id} />
        </div>
      </section>
    </div>
  );
}

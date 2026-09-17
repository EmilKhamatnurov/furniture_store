import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  JsonLd,
  buildBreadcrumbList,
  buildProductSchema,
} from "@/components/seo/json-ld";
import { ProductGallery } from "@/modules/catalog/ui/product-gallery";
import { VariantPicker } from "@/modules/catalog/ui/variant-picker";
import { CmsHtml } from "@/components/cms/cms-html";
import {
  getProductBySlug,
  getMinVariantPrice,
} from "@/modules/catalog";
import { kopecksToRubFloat } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

// 10 minutes ISR — popular product pages stay warm
export const revalidate = 600;

interface PageProps {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}

// ---------------------------------------------------------------------------
// Metadata generation — runs at build/revalidate time
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) return { title: "Товар не найден" };

  const minPrice = getMinVariantPrice(product);
  const primaryImage = product.images[0];
  const canonicalPath = urls.product(product.category.slug, product.slug);

  const description =
    product.metaDescription ??
    product.description ??
    `${product.name} — тестовая карточка мебели от ${kopecksToRubFloat(
      minPrice
    ).toLocaleString("ru-RU")} ₽. География demo — Уфа.`;

  return {
    title: product.metaTitle ?? product.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      title: product.metaTitle ?? product.name,
      description,
      url: canonicalPath,
      images: primaryImage
        ? [
            {
              url: imageUrl(primaryImage.s3Key),
              width: 1200,
              height: 900,
              alt: primaryImage.altText ?? product.name,
            },
          ]
        : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ProductPage({ params }: PageProps) {
  const { categorySlug, productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  // If user navigated via stale category slug, 308-redirect to canonical URL.
  // Prevents duplicate-content penalties when a product moves categories.
  if (product.category.slug !== categorySlug) {
    redirect(urls.product(product.category.slug, product.slug));
  }

  const breadcrumbs = [
    { name: "Главная", url: urls.home() },
    { name: "Каталог", url: urls.catalog() },
    { name: product.category.name, url: urls.category(product.category.slug) },
    {
      name: product.name,
      url: urls.product(product.category.slug, product.slug),
      current: true,
    },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <JsonLd
        data={buildProductSchema(
          product,
          urls.product(product.category.slug, product.slug)
        )}
      />

      <Container>
        <div className="py-8 md:py-12 lg:py-16">
          <Breadcrumbs items={breadcrumbs} className="mb-8" />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.72fr)] lg:gap-16">
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            <div className="space-y-8 lg:pt-4">
              <header>
                <p className="eyebrow mb-4 text-pine">
                  {product.category.name}
                </p>
                <h1 className="display-title text-4xl sm:text-5xl lg:text-6xl">
                  {product.name}
                </h1>
              </header>

              {product.description && (
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  {product.description}
                </p>
              )}

              <Suspense fallback={<div className="h-72 border-y border-border" />}>
                <VariantPicker
                  product={product}
                  variants={product.variants}
                  primaryImageS3Key={product.images[0]?.s3Key ?? null}
                />
              </Suspense>

              {product.attributes && product.attributes.length > 0 && (
                <div className="border-t border-border pt-7">
                  <h2 className="eyebrow mb-4">Характеристики</h2>
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    {product.attributes.map((attr) => (
                      <div
                        key={attr.name}
                        className="flex justify-between gap-6 border-b border-border/50 py-2.5"
                      >
                        <dt className="text-muted-foreground">{attr.name}</dt>
                        <dd className="font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {product.body && (
            <section className="mt-20 max-w-prose border-t border-border pt-10">
              <h2 className="display-title mb-5 text-3xl">
                Описание
              </h2>
              {/* Admin-authored HTML — sanitized server-side in CmsHtml */}
              <CmsHtml html={product.body} />
            </section>
          )}
        </div>
      </Container>
    </>
  );
}

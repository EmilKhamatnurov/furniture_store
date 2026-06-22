import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/json-ld";
import { ProductCard } from "@/modules/catalog/ui/product-card";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
} from "@/modules/catalog";
import { urls } from "@/lib/utils/urls";

export const revalidate = 300; // 5 min ISR

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { title: "Категория не найдена" };

  return {
    title: category.metaTitle ?? category.name,
    description:
      category.metaDescription ??
      category.description ??
      `Товары в категории «${category.name}» — мебель ручной работы.`,
    alternates: { canonical: urls.category(category.slug) },
    openGraph: {
      title: category.metaTitle ?? category.name,
      description:
        category.metaDescription ?? category.description ?? "",
      url: urls.category(category.slug),
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const products = await getProductsByCategorySlug(categorySlug);

  const breadcrumbs = [
    { name: "Главная", url: urls.home() },
    { name: "Каталог", url: urls.catalog() },
    { name: category.name, url: urls.category(categorySlug), current: true },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />

      <Container>
        <div className="py-8 md:py-12">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <header className="mb-10">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">
              {category.name}
            </h1>
            <p className="eyebrow mt-3">
              {products.length} {pluralizeProducts(products.length)}
            </p>
            {category.description && (
              <p className="text-muted-foreground text-lg max-w-2xl mt-4">
                {category.description}
              </p>
            )}
          </header>

          {products.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              В этой категории пока нет товаров.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

// Russian plural forms: 1 изделие, 2 изделия, 5 изделий
function pluralizeProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "изделие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "изделия";
  return "изделий";
}

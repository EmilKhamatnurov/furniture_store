import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbList } from "@/components/seo/json-ld";
import { getAllCategories } from "@/modules/catalog";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

// Rendered per request (catalog reads are Redis-cached). Keeps the Docker
// build DB-independent — no build-time prerender of this route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог мебели",
  description:
    "Полный каталог мебели ручной работы: кресла, диваны, столы, кровати и другие категории. Все товары — собственное производство.",
  alternates: { canonical: urls.catalog() },
};

export default async function CatalogIndexPage() {
  const categories = await getAllCategories();

  const breadcrumbs = [
    { name: "Главная", url: urls.home() },
    { name: "Каталог", url: urls.catalog(), current: true },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />

      <Container>
        <div className="py-8 md:py-12">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Каталог
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-12">
            Все категории нашей мебели. Выберите раздел, чтобы увидеть товары.
          </p>

          {categories.length === 0 ? (
            <p className="text-muted-foreground">
              Каталог пока пуст. Скоро мы добавим товары.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={urls.category(cat.slug)}
                  className="group block"
                >
                  <article className="space-y-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={imageUrl(cat.imageKey)}
                        alt={cat.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium group-hover:text-primary transition-colors">
                        {cat.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cat.productCount}{" "}
                        {pluralizeProducts(cat.productCount)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

// Russian plural forms: 1 товар, 2 товара, 5 товаров
function pluralizeProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "товара";
  return "товаров";
}

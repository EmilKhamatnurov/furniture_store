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
        <div className="py-10 md:py-16">
          <Breadcrumbs items={breadcrumbs} className="mb-10" />

          <p className="eyebrow mb-4 text-pine">Коллекция / demo</p>
          <h1 className="display-title text-5xl md:text-7xl mb-5">
            Каталог
          </h1>
          <p className="text-muted-foreground text-base leading-7 md:text-lg max-w-xl mb-14">
            Тестовые категории будущей витрины. Выберите предмет, чтобы посмотреть доступные модели.
          </p>

          {categories.length === 0 ? (
            <p className="text-muted-foreground">
              Каталог пока пуст. Скоро мы добавим товары.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat, index) => (
                <Link
                  key={cat.id}
                  href={urls.category(cat.slug)}
                  className="group block"
                >
                  <article>
                    <div className={`relative overflow-hidden bg-muted ${index % 3 === 1 ? "aspect-[5/4]" : "aspect-[4/5]"}`}>
                      <Image
                        src={imageUrl(cat.imageKey)}
                        alt={cat.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3">
                      <h2 className="font-serif text-2xl font-normal group-hover:text-pine transition-colors">
                        {cat.name}
                      </h2>
                      <p className="shrink-0 text-xs text-muted-foreground">
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

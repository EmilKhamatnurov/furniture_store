import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/modules/catalog/ui/product-card";
import {
  getCategoryTree,
  getProductsByCategorySlug,
  type ProductWithRelations,
} from "@/modules/catalog";
import { listPublishedPosts } from "@/modules/cms";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

const blogDateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Rendered per request — reads live catalog data (Redis-cached underneath).
// force-dynamic keeps the Docker build DB-independent (no build-time prerender).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мебель ручной работы — серийная мебель от мастерской",
  description:
    "Кресла, диваны, столы и другая мебель ручной работы. Авторский дизайн, качественные материалы, доставка по Москве и области.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KHAMATNUROV MEBEL — мебель ручной работы",
    description:
      "Серийная мебель ручной работы. Доставка по Москве и области.",
    url: "/",
  },
};

export default async function HomePage() {
  const categoryTree = await getCategoryTree();

  // Pull a small "featured" set: first 8 products from the first category
  const firstCategory = categoryTree[0];
  let featured: ProductWithRelations[] = [];
  if (firstCategory) {
    const all = await getProductsByCategorySlug(firstCategory.slug);
    featured = all.slice(0, 8);
  }

  const latestPosts = (await listPublishedPosts()).slice(0, 3);

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <Container>
          <div className="py-20 md:py-28 max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-4 py-1.5 eyebrow">
              Ручная работа · массив дерева · с 2018
            </span>

            <h1 className="mt-7 font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
              Мебель,
              <br />
              которая <span className="italic font-medium">остаётся</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Изделия из&nbsp;скандинавской ели, берёзы и&nbsp;дуба. Без&nbsp;посредников —
              напрямую из&nbsp;собственной мастерской.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={urls.catalog()}>Смотреть каталог</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={urls.page("about")}>Как мы делаем →</Link>
              </Button>
            </div>
          </div>
        </Container>

        {/* Trust bar */}
        <div className="border-t border-border">
          <Container>
            <ul className="flex flex-wrap gap-x-10 gap-y-3 py-5 text-sm text-muted-foreground">
              {[
                "Доставка по России",
                "Гарантия 5 лет",
                "100% массив дерева",
                "Оплата при получении",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Categories                                                        */}
      {/* ----------------------------------------------------------------- */}
      {categoryTree.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow mb-2">Категории</p>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                  Что мы делаем
                </h2>
              </div>
              <Link
                href={urls.catalog()}
                className="text-sm font-medium hover:text-muted-foreground transition-colors whitespace-nowrap"
              >
                Все категории →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryTree.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={urls.category(cat.slug)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={imageUrl(cat.imageKey)}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-background text-lg font-medium">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Featured products                                                 */}
      {/* ----------------------------------------------------------------- */}
      {featured.length > 0 && firstCategory && (
        <section className="py-16 md:py-20 border-t border-border bg-secondary/30">
          <Container>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow mb-2">Витрина</p>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                  Популярное в&nbsp;категории «{firstCategory.name}»
                </h2>
              </div>
              <Link
                href={urls.category(firstCategory.slug)}
                className="text-sm font-medium hover:text-muted-foreground transition-colors whitespace-nowrap"
              >
                Все товары →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Latest blog posts — fresh content + internal links to the blog    */}
      {/* ----------------------------------------------------------------- */}
      {latestPosts.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border">
          <Container>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow mb-2">Журнал</p>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                  Из блога
                </h2>
              </div>
              <Link
                href={urls.blog()}
                className="text-sm font-medium hover:text-muted-foreground transition-colors whitespace-nowrap"
              >
                Все статьи →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={urls.blogPost(post.slug)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <Image
                      src={imageUrl(post.coverImageKey)}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {post.publishedAt && (
                      <time className="text-xs text-muted-foreground">
                        {blogDateFmt.format(post.publishedAt)}
                      </time>
                    )}
                    <h3 className="font-serif text-lg font-semibold mt-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

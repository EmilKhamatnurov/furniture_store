import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  getCategoryTree,
  getProductBySlug,
  type ProductWithRelations,
} from "@/modules/catalog";
import { ProductCard } from "@/modules/catalog/ui/product-card";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Предметная мебель — тестовая витрина",
  description:
    "Тестовая витрина KHAMATNUROV MEBEL: современная предметная мебель собственного дизайна в Уфе.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KHAMATNUROV MEBEL — предметная мебель",
    description: "Тестовая витрина мастерской из Уфы.",
    url: "/",
  },
};

export default async function HomePage() {
  const categoryTree = await getCategoryTree();
  const demoProduct = await getProductBySlug("khm-demo-01");
  const featured: ProductWithRelations[] = demoProduct ? [demoProduct] : [];

  return (
    <>
      <section className="border-b border-border">
        <Container size="wide" className="px-0 sm:px-0 lg:px-0">
          <div className="grid min-h-[min(780px,calc(100svh-64px))] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="flex min-w-0 flex-col justify-between overflow-hidden px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-pine">Демонстрационная витрина</p>
                <span className="text-xs tabular-nums text-muted-foreground">01 / 01</span>
              </div>

              <div className="max-w-[38rem] py-14 lg:py-0">
                <p className="mb-5 text-sm leading-6 text-muted-foreground sm:text-base">
                  Test/demo-сборка · Уфа
                </p>
                <h1 className="display-title text-[clamp(3.4rem,5.2vw,6.25rem)]">
                  Мебель как
                  <br />
                  часть <em className="font-serif text-oak not-italic">пространства.</em>
                </h1>
                <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                  Тестовый первый срез магазина. Здесь проверяем каталог,
                  конфигурации, остатки и путь к заказу на одной модели стола.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button size="lg" asChild>
                    <Link href={urls.catalog()}>Смотреть витрину</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#materials">О материале</Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:gap-8 sm:text-sm">
                <p><span className="block text-foreground">Уфа</span>тестовая доставка</p>
                <p><span className="block text-foreground">4 SKU</span>в демонстрации</p>
                <p><span className="block text-foreground">В наличии</span>по остаткам SKU</p>
              </div>
            </div>

            <div className="relative min-h-[26rem] overflow-hidden bg-secondary lg:min-h-0">
              <Image
                src="/images/demo/hero-table.png"
                alt="Тестовая интерьерная фотография обеденного стола из дуба"
                fill
                priority
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-foreground/45 to-transparent p-5 text-primary-foreground sm:p-8">
                <p className="max-w-[14rem] text-xs leading-5 sm:text-sm">
                  Обеденный стол KHM Demo 01
                </p>
                <span className="eyebrow text-primary-foreground/75">Oak / 2026</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28 lg:py-36" id="materials">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="eyebrow mb-5 text-pine">01 — Материал и конструкция</p>
              <h2 className="display-title max-w-lg text-4xl sm:text-5xl lg:text-6xl">
                Детали создают
                <br />
                целое.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-8">
              <p className="text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                В demo-версии мы показываем, как должен работать язык будущего
                каталога: крупный предмет, точная фактура и спокойная информация
                без декоративного шума.
              </p>
              <div className="mt-8 editorial-rule" />
              <p className="mt-4 text-sm text-muted-foreground">Дуб · матовое покрытие · графитовая деталь</p>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
            <div className="relative min-h-[32rem] overflow-hidden bg-pine lg:col-span-5 lg:min-h-[42rem]">
              <Image
                src="/images/demo/oak-joint-detail.png"
                alt="Тестовая макрофотография дубового соединения мебели"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex min-h-[18rem] flex-col justify-between bg-pine p-7 text-pine-foreground sm:p-10 lg:col-span-7 lg:min-h-[42rem] lg:p-14">
              <p className="eyebrow text-pine-foreground/60">Тестовый принцип витрины</p>
              <div className="max-w-2xl">
                <p className="display-title text-3xl sm:text-4xl lg:text-5xl">
                  Не украшать интерфейс вместо того, чтобы показать предмет.
                </p>
                <p className="mt-6 max-w-xl text-sm leading-6 text-pine-foreground/70 sm:text-base sm:leading-7">
                  Темные поверхности используются точечно — чтобы подчеркнуть
                  композицию, фото и действие, а не сделать сайт тяжелым.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {categoryTree.length > 0 && (
        <section className="border-y border-border bg-card py-20 sm:py-28">
          <Container>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-4 text-pine">02 — Коллекция</p>
                <h2 className="display-title text-4xl sm:text-5xl">Выберите предмет</h2>
              </div>
              <Link href={urls.catalog()} className="shrink-0 border-b border-foreground pb-1 text-sm font-semibold hover:text-muted-foreground">
                Весь каталог
              </Link>
            </div>

            <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {categoryTree.slice(0, 4).map((category, index) => (
                <Link key={category.id} href={urls.category(category.slug)} className="group block">
                  <div className={`relative overflow-hidden bg-secondary ${index === 0 ? "aspect-[4/5]" : "aspect-[5/4]"}`}>
                    <Image
                      src={imageUrl(category.imageKey)}
                      alt={category.name}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                    <h3 className="font-serif text-xl leading-none">{category.name}</h3>
                    <span className="text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 border-y border-border py-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow mb-4 text-pine">03 — Первая модель</p>
              <h2 className="display-title text-4xl sm:text-5xl">KHM Demo 01</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Демонстрационная модель для проверки вариантов: размер, материал,
                оттенок, отделка, точная цена и остаток.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={demoProduct ? urls.product(demoProduct.category.slug, demoProduct.slug) : urls.catalog()}>
                Перейти к модели
              </Link>
            </Button>
          </div>

          {featured.length > 0 && (
            <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/modules/cms";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/json-ld";
import { CmsHtml } from "@/components/cms/cms-html";
import { absoluteUrl, urls } from "@/lib/utils/urls";

// Static pages change rarely; ISR-cache for 5 min, busted on admin edits.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return { title: "Страница не найдена" };

  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: urls.page(slug) },
    openGraph: {
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      url: absoluteUrl(urls.page(slug)),
      type: "article",
    },
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <Container>
      <article className="py-10 md:py-14 max-w-3xl">
        <JsonLd
          data={buildBreadcrumbList([
            { name: "Главная", url: urls.home() },
            { name: page.title, url: urls.page(slug) },
          ])}
        />

        <Breadcrumbs
          className="mb-6"
          items={[
            { name: "Главная", url: urls.home() },
            { name: page.title, url: urls.page(slug), current: true },
          ]}
        />

        <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
          {page.title}
        </h1>

        {/* Admin-authored HTML — sanitized server-side in CmsHtml */}
        <CmsHtml html={page.body} />
      </article>
    </Container>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublishedPostBySlug } from "@/modules/cms";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/json-ld";
import { CmsHtml } from "@/components/cms/cms-html";
import { imageUrl } from "@/lib/utils/images";
import { absoluteUrl, urls } from "@/lib/utils/urls";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ postSlug: string }>;
}

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPublishedPostBySlug(postSlug);
  if (!post) return { title: "Статья не найдена" };

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: urls.blogPost(postSlug) },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      url: absoluteUrl(urls.blogPost(postSlug)),
      type: "article",
      ...(post.publishedAt
        ? { publishedTime: post.publishedAt.toISOString() }
        : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { postSlug } = await params;
  const post = await getPublishedPostBySlug(postSlug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: absoluteUrl(urls.blogPost(postSlug)),
  };

  return (
    <Container>
      <article className="py-10 md:py-14 max-w-3xl">
        <JsonLd data={articleSchema} />
        <JsonLd
          data={buildBreadcrumbList([
            { name: "Главная", url: urls.home() },
            { name: "Блог", url: urls.blog() },
            { name: post.title, url: urls.blogPost(postSlug) },
          ])}
        />

        <Breadcrumbs
          className="mb-6"
          items={[
            { name: "Главная", url: urls.home() },
            { name: "Блог", url: urls.blog() },
            { name: post.title, url: urls.blogPost(postSlug), current: true },
          ]}
        />

        <header className="mb-8">
          {post.publishedAt && (
            <time className="text-sm text-muted-foreground">
              {dateFmt.format(post.publishedAt)}
            </time>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mt-1">
            {post.title}
          </h1>
        </header>

        {post.coverImageKey && (
          <div className="relative aspect-[16/9] bg-muted overflow-hidden rounded-lg mb-8">
            <Image
              src={imageUrl(post.coverImageKey)}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Admin-authored HTML — sanitized server-side in CmsHtml */}
        <CmsHtml html={post.body} />
      </article>
    </Container>
  );
}

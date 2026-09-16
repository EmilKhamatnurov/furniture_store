import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getPublishedPostBySlug,
  getRelatedPosts,
  getAuthorName,
} from "@/modules/cms";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd, buildBreadcrumbList, buildArticle } from "@/components/seo/json-ld";
import { CmsHtml } from "@/components/cms/cms-html";
import { imageUrl } from "@/lib/utils/images";
import { readingTime, countWords } from "@/lib/utils/reading-time";
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

  const ogImage = post.coverImageKey ? imageUrl(post.coverImageKey) : undefined;
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: urls.blogPost(postSlug) },
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      url: absoluteUrl(urls.blogPost(postSlug)),
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt.toISOString() } : {}),
      modifiedTime: post.updatedAt.toISOString(),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { postSlug } = await params;
  const post = await getPublishedPostBySlug(postSlug);
  if (!post) notFound();

  const [authorName, related] = await Promise.all([
    getAuthorName(post.authorId),
    getRelatedPosts(postSlug, 3),
  ]);

  const rt = readingTime(post.body);

  const article = buildArticle({
    title: post.title,
    description: post.excerpt ?? undefined,
    url: urls.blogPost(postSlug),
    imageUrl: post.coverImageKey ? imageUrl(post.coverImageKey) : undefined,
    authorName,
    publishedAt: post.publishedAt,
    modifiedAt: post.updatedAt,
    wordCount: countWords(post.body),
    section: "Блог",
  });

  return (
    <Container>
      <article className="py-10 md:py-14 max-w-3xl">
        <JsonLd data={article} />
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
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{authorName}</span>
            {post.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {dateFmt.format(post.publishedAt)}
                </time>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{rt.label}</span>
          </div>
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

      {/* Related posts — internal linking for SEO + engagement */}
      {related.length > 0 && (
        <section className="border-t border-border py-10 md:py-14">
          <h2 className="font-serif text-2xl font-semibold mb-6">Читайте также</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={urls.blogPost(r.slug)}
                className="group flex flex-col overflow-hidden rounded-lg border border-border hover:border-foreground/20 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <Image
                    src={imageUrl(r.coverImageKey)}
                    alt={r.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                  {r.excerpt && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                      {r.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

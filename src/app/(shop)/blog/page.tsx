import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/modules/cms";
import { Container } from "@/components/ui/container";
import { imageUrl } from "@/lib/utils/images";
import { urls } from "@/lib/utils/urls";

// Rendered per request — keeps the Docker build DB-independent.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Статьи о мебели, материалах, уходе и обустройстве дома от Мебельной мастерской.",
  alternates: { canonical: urls.blog() },
};

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();

  return (
    <Container>
      <div className="py-10 md:py-14">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">Блог</h1>
          <p className="text-muted-foreground mt-2">
            О материалах, уходе за мебелью и обустройстве дома.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-border p-10 text-center">
            Скоро здесь появятся статьи.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
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
                      {dateFmt.format(post.publishedAt)}
                    </time>
                  )}
                  <h2 className="font-serif text-lg font-semibold mt-1 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

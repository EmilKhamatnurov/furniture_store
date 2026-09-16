import "server-only";
import { db } from "@/lib/db";
import { and, eq, ne, desc, isNotNull } from "drizzle-orm";
import { pages, blogPosts } from "./db/schema";
import { customers } from "@/modules/customers/db/schema";
import type { Page, BlogPost } from "./db/schema";

// ---------------------------------------------------------------------------
// CMS public reads — only published content is ever returned here.
// Admin reads/writes live in modules/admin/content.ts.
// ---------------------------------------------------------------------------

export async function getPublishedPageBySlug(slug: string): Promise<Page | null> {
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.isPublished, true)),
  });
  return page ?? null;
}

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageKey: string | null;
  publishedAt: Date | null;
}

export async function listPublishedPosts(): Promise<BlogListItem[]> {
  return db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageKey: blogPosts.coverImageKey,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.isPublished, true), isNotNull(blogPosts.publishedAt)))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)),
  });
  return post ?? null;
}

/** Recent published posts excluding the given slug — for the "related" block. */
export async function getRelatedPosts(
  excludeSlug: string,
  limit = 3
): Promise<BlogListItem[]> {
  return db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageKey: blogPosts.coverImageKey,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.isPublished, true),
        isNotNull(blogPosts.publishedAt),
        ne(blogPosts.slug, excludeSlug)
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit);
}

/** Author display name for a post (falls back to the brand editorial name). */
export async function getAuthorName(authorId: string | null): Promise<string> {
  const FALLBACK = "Редакция KHAMATNUROV MEBEL";
  if (!authorId) return FALLBACK;
  const author = await db.query.customers.findFirst({
    where: eq(customers.id, authorId),
    columns: { firstName: true, lastName: true },
  });
  if (!author) return FALLBACK;
  return `${author.firstName} ${author.lastName}`.trim() || FALLBACK;
}

/** Published post slugs + lastmod + cover image key for the sitemap */
export async function listPublishedPostSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date; coverImageKey: string | null }>
> {
  return db
    .select({
      slug: blogPosts.slug,
      updatedAt: blogPosts.updatedAt,
      coverImageKey: blogPosts.coverImageKey,
    })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));
}

/** Published static-page slugs for the sitemap */
export async function listPublishedPageSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages)
    .where(eq(pages.isPublished, true));
}

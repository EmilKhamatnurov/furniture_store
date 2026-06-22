import "server-only";
import { db } from "@/lib/db";
import { and, eq, desc, isNotNull } from "drizzle-orm";
import { pages, blogPosts } from "./db/schema";
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

/** Published post slugs + lastmod for the sitemap */
export async function listPublishedPostSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return db
    .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
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

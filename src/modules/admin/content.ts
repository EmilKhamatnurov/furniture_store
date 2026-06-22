import "server-only";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { pages, blogPosts } from "@/modules/cms/db/schema";
import type { Page, BlogPost } from "@/modules/cms/db/schema";

// ---------------------------------------------------------------------------
// Admin CMS data access — full reads (incl. unpublished) + writes.
// ---------------------------------------------------------------------------

// ---- Pages ----------------------------------------------------------------

export async function listPagesAdmin(): Promise<Page[]> {
  return db.query.pages.findMany({ orderBy: [desc(pages.updatedAt)] });
}

export async function getPageAdmin(id: string): Promise<Page | undefined> {
  return db.query.pages.findFirst({ where: eq(pages.id, id) });
}

export interface PageInput {
  slug: string;
  title: string;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

export async function createPageAdmin(input: PageInput): Promise<Page> {
  const [page] = await db.insert(pages).values(input).returning();
  if (!page) throw new Error("Page insert returned no rows");
  return page;
}

export async function updatePageAdmin(id: string, input: PageInput): Promise<void> {
  await db
    .update(pages)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(pages.id, id));
}

// ---- Blog posts -----------------------------------------------------------

export async function listPostsAdmin(): Promise<BlogPost[]> {
  return db.query.blogPosts.findMany({ orderBy: [desc(blogPosts.updatedAt)] });
}

export async function getPostAdmin(id: string): Promise<BlogPost | undefined> {
  return db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
}

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

export async function createPostAdmin(input: PostInput): Promise<BlogPost> {
  const [post] = await db
    .insert(blogPosts)
    .values({
      ...input,
      // Stamp publishedAt the first time a post goes live
      publishedAt: input.isPublished ? new Date() : null,
    })
    .returning();
  if (!post) throw new Error("Post insert returned no rows");
  return post;
}

export async function updatePostAdmin(id: string, input: PostInput): Promise<void> {
  const existing = await getPostAdmin(id);
  // Set publishedAt on first publish; keep the original date afterwards.
  const publishedAt =
    input.isPublished && !existing?.publishedAt
      ? new Date()
      : (existing?.publishedAt ?? null);

  await db
    .update(blogPosts)
    .set({ ...input, publishedAt, updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

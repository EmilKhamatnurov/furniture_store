import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { customers } from "@/modules/customers/db/schema";

// ---------------------------------------------------------------------------
// CMS schema — static pages + blog for SEO content
// ---------------------------------------------------------------------------

// Static pages: /about, /delivery, /returns, /contacts, /privacy
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(), // HTML content
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)]
);

// Blog posts for content marketing / SEO
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    coverImageKey: text("cover_image_key"), // S3 key
    authorId: uuid("author_id").references(() => customers.id),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("blog_posts_slug_idx").on(t.slug),
    index("blog_posts_published_idx").on(t.isPublished, t.publishedAt),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(customers, {
    fields: [blogPosts.authorId],
    references: [customers.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Page = typeof pages.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;

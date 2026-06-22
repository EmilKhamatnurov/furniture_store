import type { MetadataRoute } from "next";
import {
  getAllCategories,
  listAllProductSlugsForSitemap,
} from "@/modules/catalog";
import { listPublishedPostSlugs, listPublishedPageSlugs } from "@/modules/cms";
import { absoluteUrl } from "@/lib/utils/urls";
import { urls } from "@/lib/utils/urls";

// ---------------------------------------------------------------------------
// /sitemap.xml — generated from DB
// Limit: 50,000 URLs / 50 MB per sitemap (we're far from that).
// Cached for 1 hour via Next.js' route segment cache.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Resilient: if the DB is unreachable (e.g. during the Docker image build),
  // fall back to static URLs only so the build never fails. ISR refreshes
  // the full sitemap once the DB is available at runtime.
  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  let productLinks: Awaited<ReturnType<typeof listAllProductSlugsForSitemap>> = [];
  let postLinks: Awaited<ReturnType<typeof listPublishedPostSlugs>> = [];
  let pageLinks: Awaited<ReturnType<typeof listPublishedPageSlugs>> = [];
  try {
    [categories, productLinks, postLinks, pageLinks] = await Promise.all([
      getAllCategories(),
      listAllProductSlugsForSitemap(),
      listPublishedPostSlugs(),
      listPublishedPageSlugs(),
    ]);
  } catch (err) {
    console.error("[sitemap] DB unavailable, emitting static URLs only:", err);
  }

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(urls.home()),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: absoluteUrl(urls.catalog()),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(urls.blog()),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Published static pages (from CMS)
  const pageEntries: MetadataRoute.Sitemap = pageLinks.map((p) => ({
    url: absoluteUrl(urls.page(p.slug)),
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  // Published blog posts
  const postEntries: MetadataRoute.Sitemap = postLinks.map((p) => ({
    url: absoluteUrl(urls.blogPost(p.slug)),
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: absoluteUrl(urls.category(cat.slug)),
    lastModified: cat.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = productLinks.map((link) => ({
    url: absoluteUrl(urls.product(link.categorySlug, link.productSlug)),
    lastModified: link.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...pageEntries,
    ...postEntries,
    ...categoryEntries,
    ...productEntries,
  ];
}

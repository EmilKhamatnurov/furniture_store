import { listPublishedPosts } from "@/modules/cms";
import { absoluteUrl, urls } from "@/lib/utils/urls";

// ---------------------------------------------------------------------------
// /blog/rss.xml — RSS 2.0 feed of published posts.
// Syndication + faster discovery of new articles by aggregators/crawlers.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const BRAND = "KHAMATNUROV MEBEL";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts();
  } catch {
    // DB unavailable (e.g. during build) — emit an empty but valid feed
  }

  const self = absoluteUrl("/blog/rss.xml");
  const blogUrl = absoluteUrl(urls.blog());

  const items = posts
    .map((p) => {
      const link = absoluteUrl(urls.blogPost(p.slug));
      const pubDate = (p.publishedAt ?? new Date()).toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${p.excerpt ? `<description>${esc(p.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(BRAND)} — Блог</title>
    <link>${blogUrl}</link>
    <description>Статьи о мебели, материалах и обустройстве дома.</description>
    <language>ru-RU</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

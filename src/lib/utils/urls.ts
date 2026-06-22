// ---------------------------------------------------------------------------
// URL utilities — single source of truth for site URLs
// Use these everywhere instead of hardcoding paths.
//
// NOTE: intentionally does NOT import from @/config/env so this module is
// safe to use in client components. NEXT_PUBLIC_* vars are inlined by
// Next.js at build time and available in both server and browser contexts.
// ---------------------------------------------------------------------------

const BASE_URL = (
  process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"
).replace(/\/$/, "");

export const urls = {
  home: () => "/",
  catalog: () => "/catalog",
  category: (categorySlug: string) => `/catalog/${categorySlug}`,
  product: (categorySlug: string, productSlug: string) =>
    `/catalog/${categorySlug}/${productSlug}`,
  cart: () => "/cart",
  checkout: () => "/checkout",
  account: () => "/account",
  accountOrders: () => "/account/orders",
  accountProfile: () => "/account/profile",
  login: () => "/login",
  register: () => "/register",
  order: (orderId: string) => `/orders/${orderId}`,
  blog: () => "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  page: (slug: string) => `/${slug}`,
} as const;

/** Build an absolute URL — required for sitemap, OG tags, schema.org */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// Image URL builder
// Safe for both server and client components — uses NEXT_PUBLIC_* var so
// Next.js inlines it at build time. No import from @/config/env needed.
//
// NEXT_PUBLIC_S3_BASE_URL = "https://s3.selcdn.ru/furniture-shop-media"
// (S3 endpoint + bucket — public info, not a secret)
// ---------------------------------------------------------------------------

const PLACEHOLDER = "/placeholder-furniture.svg";

const S3_BASE = (process.env["NEXT_PUBLIC_S3_BASE_URL"] ?? "").replace(/\/$/, "");

export function imageUrl(s3Key: string | null | undefined): string {
  if (!s3Key) return PLACEHOLDER;
  // S3 keys never start with slash; ensure clean concat
  const cleanKey = s3Key.replace(/^\/+/, "");
  if (!cleanKey) return PLACEHOLDER;
  // Dev fallback: no S3 configured → files are stored under public/uploads
  // (see src/lib/storage.ts) and served from /uploads/<key>.
  if (!S3_BASE) return `/uploads/${cleanKey}`;
  return `${S3_BASE}/${cleanKey}`;
}

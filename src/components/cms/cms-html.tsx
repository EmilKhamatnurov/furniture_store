import { sanitizeCmsHtml } from "@/lib/security/sanitize-html";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// CmsHtml — renders admin-authored HTML safely.
// Server component: sanitizes on the server before it ever reaches the DOM,
// so the raw value is never trusted. Use instead of raw dangerouslySetInnerHTML.
// ---------------------------------------------------------------------------
export function CmsHtml({ html, className }: { html: string; className?: string }) {
  const clean = sanitizeCmsHtml(html);
  return (
    <div
      className={cn("cms-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

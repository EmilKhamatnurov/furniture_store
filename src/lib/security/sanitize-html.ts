import "server-only";
import sanitizeHtml from "sanitize-html";

// ---------------------------------------------------------------------------
// CMS HTML sanitizer — defence against stored XSS in admin-authored content
// (static pages, blog posts, product body). Applied at the render sink so it
// covers content from any source (admin forms, seed, direct DB writes).
//
// Allowlist matches the tags styled by `.cms-content` in globals.css.
// ---------------------------------------------------------------------------
export function sanitizeCmsHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "b", "em", "i", "u", "s", "blockquote",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["class"],
    },
    // Only safe URL schemes; blocks javascript:, data: (except images), etc.
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    // Force external links to be safe
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
    // Drop disallowed tags' content too for <script>/<style>
    nonTextTags: ["script", "style", "textarea", "noscript", "iframe"],
  });
}

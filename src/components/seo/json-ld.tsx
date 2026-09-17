import { headers } from "next/headers";
import { absoluteUrl } from "@/lib/utils/urls";
import { kopecksToRubFloat } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";
import {
  getMinVariantPrice,
  isProductInStock,
  type ProductWithRelations,
} from "@/modules/catalog";

// ---------------------------------------------------------------------------
// JsonLd component — renders structured data into the page
// Use in Server Components only; payload should be JSON-serializable.
// Reads the per-request CSP nonce (set in middleware) so the inline <script>
// is allowed under our strict Content-Security-Policy.
// ---------------------------------------------------------------------------

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// schema.org JSON-LD builders
// ---------------------------------------------------------------------------

const ORGANIZATION_NAME = "KHAMATNUROV MEBEL";
const LOGO_URL = absoluteUrl("/icon.svg");
// Social profiles — fill in as they appear (helps entity recognition / Knowledge Panel)
const SAME_AS: string[] = [];

/** Reusable Organization node, referenced as publisher by Article schema. */
function organizationNode() {
  return {
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: LOGO_URL },
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: LOGO_URL },
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressLocality: "Уфа",
    },
    ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
  };
}

// ---------------------------------------------------------------------------
// Article — for blog posts. Rich result eligibility (author, publisher, image,
// dates) helps Google/Yandex surface the post with metadata in search.
// ---------------------------------------------------------------------------
interface ArticleInput {
  title: string;
  description?: string | undefined;
  url: string;
  imageUrl?: string | undefined;
  authorName: string;
  publishedAt?: Date | null | undefined;
  modifiedAt: Date;
  wordCount?: number | undefined;
  section?: string | undefined;
}

export function buildArticle(a: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title.slice(0, 110), // Google truncates headlines past ~110
    ...(a.description ? { description: a.description } : {}),
    ...(a.imageUrl ? { image: [a.imageUrl] } : {}),
    inLanguage: "ru-RU",
    author: { "@type": "Person", name: a.authorName },
    publisher: organizationNode(),
    ...(a.publishedAt ? { datePublished: a.publishedAt.toISOString() } : {}),
    dateModified: a.modifiedAt.toISOString(),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
    ...(a.section ? { articleSection: a.section } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(a.url) },
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION_NAME,
    url: absoluteUrl("/"),
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/catalog")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildProductSchema(
  product: ProductWithRelations,
  productPath: string
) {
  const minPrice = getMinVariantPrice(product);
  const inStock = isProductInStock(product);

  const variantPrices = new Set(
    product.variants.map((v) =>
      kopecksToRubFloat(v.priceCopecks ?? product.basePriceCopecks)
    )
  );
  const hasVaryingPrices = variantPrices.size > 1;

  const baseOffer = {
    priceCurrency: "RUB",
    availability: inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    url: absoluteUrl(productPath),
    seller: { "@type": "Organization", name: ORGANIZATION_NAME },
  };

  const offers = hasVaryingPrices
    ? {
        "@type": "AggregateOffer",
        ...baseOffer,
        lowPrice: kopecksToRubFloat(minPrice),
        highPrice: Math.max(...Array.from(variantPrices)),
        offerCount: product.variants.length,
      }
    : {
        "@type": "Offer",
        ...baseOffer,
        price: kopecksToRubFloat(minPrice),
      };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.metaDescription ?? "",
    sku: product.variants[0]?.sku ?? product.id,
    category: product.category.name,
    image: product.images.map((img) => imageUrl(img.s3Key)),
    brand: { "@type": "Brand", name: ORGANIZATION_NAME },
    offers,
  };
}

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Content-Security-Policy with a per-request nonce.
//
// Replaces the previous static CSP (which needed script-src 'unsafe-inline').
// Next.js automatically applies the nonce from this header to its own inline
// bootstrap scripts; our JsonLd component reads it from the `x-nonce` header.
// 'strict-dynamic' lets nonced loaders pull further scripts (e.g. Metrika).
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    `default-src 'self'`,
    // 'unsafe-eval' only in dev (React Fast Refresh needs it)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind/Next inject inline styles
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://mc.yandex.ru`,
    `frame-src https://yookassa.ru https://yoomoney.ru`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Run on pages only — skip API routes and static assets.
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    },
  ],
};

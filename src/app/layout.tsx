import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/modules/cart";
import { YandexMetrika } from "@/components/analytics/metrika";

// ---------------------------------------------------------------------------
// Fonts — Prata (display) + Manrope (UI/body), both with Cyrillic support.
// Exposed as CSS variables and wired to Tailwind's font-serif / font-sans.
// ---------------------------------------------------------------------------
const prata = Prata({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// ---------------------------------------------------------------------------
// Root layout — shared across all routes
// SEO: base metadata inherited by all pages; override per page as needed
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"
  ),
  title: {
    template: "%s | KHAMATNUROV MEBEL",
    default: "KHAMATNUROV MEBEL — мебель ручной работы",
  },
  description:
    "Современная предметная мебель собственного дизайна. Тестовая витрина мастерской из Уфы.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "KHAMATNUROV MEBEL",
  },
  // Search-console ownership verification (fill values in env when registering)
  verification: {
    ...(process.env["YANDEX_VERIFICATION"]
      ? { yandex: process.env["YANDEX_VERIFICATION"] }
      : {}),
    ...(process.env["GOOGLE_SITE_VERIFICATION"]
      ? { google: process.env["GOOGLE_SITE_VERIFICATION"] }
      : {}),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${prata.variable} ${manrope.variable}`}
    >
      <body className="font-sans antialiased">
        <YandexMetrika />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

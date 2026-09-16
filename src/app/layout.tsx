import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/modules/cart";
import { YandexMetrika } from "@/components/analytics/metrika";

// ---------------------------------------------------------------------------
// Fonts — Playfair Display (serif display) + DM Sans (UI/body).
// Exposed as CSS variables and wired to Tailwind's font-serif / font-sans.
// ---------------------------------------------------------------------------
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
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
    "Серийная мебель ручной работы с доставкой по Москве и МО. Качественные материалы, авторский дизайн.",
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
      className={`${playfair.variable} ${dmSans.variable}`}
    >
      <body className="font-sans antialiased">
        <YandexMetrika />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildOrganization,
  buildWebSite,
} from "@/components/seo/json-ld";
import { CartDrawer } from "@/modules/cart/ui/cart-drawer";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Site-wide structured data */}
      <JsonLd data={buildOrganization()} />
      <JsonLd data={buildWebSite()} />

      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CartDrawer />
      </div>
    </>
  );
}

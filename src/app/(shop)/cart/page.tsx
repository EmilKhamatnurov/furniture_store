import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container>
      <div className="py-8 md:py-12">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-8">
          Корзина
        </h1>
        <CartPageClient />
      </div>
    </Container>
  );
}

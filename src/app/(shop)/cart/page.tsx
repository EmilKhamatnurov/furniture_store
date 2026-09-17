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
      <div className="py-10 md:py-16">
        <p className="eyebrow mb-4 text-pine">Заказ / 01</p>
        <h1 className="display-title mb-10 text-5xl md:text-6xl">
          Корзина
        </h1>
        <CartPageClient />
      </div>
    </Container>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container>
      <div className="py-8 md:py-12">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-8">
          Оформление заказа
        </h1>
        <CheckoutForm />
      </div>
    </Container>
  );
}

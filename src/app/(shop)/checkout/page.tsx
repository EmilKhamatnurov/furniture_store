import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CheckoutForm } from "./checkout-form";
import { getActiveZonesWithTariffs } from "@/modules/shipping";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const zones = await getActiveZonesWithTariffs();
  const zoneOptions = zones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <Container>
      <div className="py-10 md:py-16">
        <p className="eyebrow mb-4 text-pine">Заказ / 02</p>
        <h1 className="display-title mb-10 text-5xl md:text-6xl">
          Оформление заказа
        </h1>
        <CheckoutForm zones={zoneOptions} />
      </div>
    </Container>
  );
}

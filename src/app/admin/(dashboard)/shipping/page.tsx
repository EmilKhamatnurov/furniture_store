import { listAllZonesWithTariffs, getVolumetricDivisor } from "@/modules/shipping";
import { DivisorForm, ZoneForm, TariffRow, AddTariffForm } from "./shipping-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Доставка" };

export default async function AdminShippingPage() {
  const [zones, divisor] = await Promise.all([
    listAllZonesWithTariffs(),
    getVolumetricDivisor(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold">Доставка</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Стоимость считается по объёмному весу товаров и весовым брекетам зоны.
        </p>
      </div>

      {/* Divisor */}
      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Параметры расчёта
        </h2>
        <DivisorForm divisor={divisor} />
        <p className="text-xs text-muted-foreground mt-2">
          Объёмный вес = Д×Ш×В (см) ÷ делитель. Курьерский стандарт — 5000.
        </p>
      </section>

      {/* Zones */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Зоны и тарифы ({zones.length})
        </h2>

        {zones.map((zone) => (
          <div key={zone.id} className="rounded-lg border border-border bg-background p-5 space-y-4">
            <ZoneForm
              id={zone.id}
              name={zone.name}
              sortOrder={zone.sortOrder}
              isActive={zone.isActive}
            />

            <div className="space-y-2 pl-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Весовые брекеты
              </p>
              {zone.tariffs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Брекетов нет — добавьте хотя бы один, иначе доставка в зону не рассчитается.
                </p>
              ) : (
                <div className="space-y-2">
                  {zone.tariffs.map((t) => (
                    <TariffRow
                      key={t.id}
                      tariffId={t.id}
                      maxWeightKg={t.maxWeightKg}
                      priceRub={Number(t.priceCopecks) / 100}
                      extraPerKgRub={Number(t.extraPerKgCopecks) / 100}
                      isActive={t.isActive}
                    />
                  ))}
                </div>
              )}
              <div className="pt-1">
                <AddTariffForm zoneId={zone.id} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* New zone */}
      <section className="rounded-lg border border-dashed border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Новая зона
        </h2>
        <ZoneForm />
      </section>
    </div>
  );
}

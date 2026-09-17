"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useCart } from "@/modules/cart";
import { checkoutAction, quoteShippingAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRub } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";
import { ShoppingBag } from "lucide-react";
import { urls } from "@/lib/utils/urls";

interface ZoneOption {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// CheckoutForm — full checkout page body.
// Cart items are serialised into a hidden input (BigInt → string) so they
// survive the FormData transport to the server action.
// ---------------------------------------------------------------------------
export function CheckoutForm({ zones }: { zones: ZoneOption[] }) {
  const { items, totalCopecks } = useCart();
  const [state, action, isPending] = useActionState(checkoutAction, null);

  const [shipping, setShipping] = useState<bigint | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quotePending, startQuote] = useTransition();

  const cartItemsJson = JSON.stringify(
    items.map((i) => ({ ...i, priceCopecks: i.priceCopecks.toString() }))
  );

  function onZoneChange(zoneId: string) {
    setQuoteError(null);
    if (!zoneId) {
      setShipping(null);
      return;
    }
    startQuote(async () => {
      const res = await quoteShippingAction(zoneId, cartItemsJson);
      if (res.shippingCopecks === null) {
        setShipping(null);
        setQuoteError(res.error ?? "Не удалось рассчитать доставку");
      } else {
        setShipping(BigInt(res.shippingCopecks));
      }
    });
  }

  const grandTotal = totalCopecks + (shipping ?? 0n);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 border-y border-border py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-pine/45" />
        <div className="space-y-1">
          <p className="font-serif text-3xl">Корзина пуста</p>
          <p className="text-sm text-muted-foreground">
            Добавьте товары, чтобы оформить заказ
          </p>
        </div>
        <Button asChild>
          <Link href={urls.catalog()}>Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <input type="hidden" name="cartItems" value={cartItemsJson} />

      {/* ---- Left: form fields ---- */}
      <div className="space-y-8">
        {state?.message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.message}
          </div>
        )}

        <section className="border-t border-border pt-5 space-y-5">
          <div className="flex items-baseline justify-between gap-4"><h2 className="font-serif text-2xl font-normal">Контактные данные</h2><span className="eyebrow">01</span></div>
          <div className="grid gap-4">
            <Field
              label="ФИО"
              name="fullName"
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
              error={state?.errors?.fullName?.[0]}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Телефон"
                name="phone"
                type="tel"
                placeholder="+7 999 000 00 00"
                autoComplete="tel"
                error={state?.errors?.phone?.[0]}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="ivan@example.com"
                autoComplete="email"
                error={state?.errors?.email?.[0]}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-5 space-y-5">
          <div className="flex items-baseline justify-between gap-4"><h2 className="font-serif text-2xl font-normal">Адрес доставки</h2><span className="eyebrow">02</span></div>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Регион / область"
                name="region"
                placeholder="Республика Башкортостан"
                autoComplete="address-level1"
                defaultValue="Республика Башкортостан"
                error={state?.errors?.region?.[0]}
              />
              <Field
                label="Город"
                name="city"
                placeholder="Уфа"
                autoComplete="address-level2"
                defaultValue="Уфа"
                readOnly
                help="Доставка в тестовом сценарии доступна по Уфе."
                error={state?.errors?.city?.[0]}
              />
            </div>
            <Field
              label="Улица и номер дома"
              name="street"
              placeholder="ул. Пушкина, д. 10"
              autoComplete="address-line1"
              error={state?.errors?.street?.[0]}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Квартира / офис"
                name="apartment"
                placeholder="кв. 42"
                autoComplete="address-line2"
                error={state?.errors?.apartment?.[0]}
                required={false}
              />
              <Field
                label="Почтовый индекс"
                name="postalCode"
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                autoComplete="postal-code"
                error={state?.errors?.postalCode?.[0]}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-5 space-y-2">
          <div className="flex items-baseline justify-between gap-4"><Label htmlFor="zoneId" className="font-serif text-2xl font-normal">Зона доставки</Label><span className="eyebrow">03</span></div>
          <select
            id="zoneId"
            name="zoneId"
            required
            defaultValue=""
            onChange={(e) => onZoneChange(e.target.value)}
            className="h-11 w-full border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={!!state?.errors?.zoneId}
          >
            <option value="" disabled>
              Выберите зону…
            </option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          {state?.errors?.zoneId && (
            <p className="text-xs text-destructive">{state.errors.zoneId[0]}</p>
          )}
          {quoteError && <p className="text-xs text-destructive">{quoteError}</p>}
        </section>

        <section className="border-t border-border pt-5 space-y-2">
          <Label htmlFor="note">
            Комментарий{" "}
            <span className="text-muted-foreground font-normal">(необязательно)</span>
          </Label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Пожелания по доставке, удобное время и т.д."
            className="w-full border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </section>
      </div>

      {/* ---- Right: order summary ---- */}
      <div className="overflow-hidden border-y border-border bg-card lg:sticky lg:top-24">
        <div className="px-5 py-4 border-b border-border">
          <p className="eyebrow text-pine">Ваш заказ</p>
        </div>

        <ul className="divide-y divide-border px-5">
          {items.map((item) => (
            <li key={item.variantId} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-muted">
                <Image
                  src={imageUrl(item.imageS3Key)}
                  alt={item.productName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.variantLabel} · {item.quantity} шт
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums shrink-0">
                {formatRub(item.priceCopecks * BigInt(item.quantity))}
              </span>
            </li>
          ))}
        </ul>

        <div className="px-5 py-5 border-t border-border space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товары</span>
              <span className="tabular-nums">{formatRub(totalCopecks)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span className="tabular-nums">
                {quotePending
                  ? "рассчитываем…"
                  : shipping === null
                    ? <span className="text-muted-foreground text-xs leading-5">выберите зону</span>
                    : shipping === 0n
                      ? "Бесплатно"
                      : formatRub(shipping)}
              </span>
            </div>
          </div>

          <div className="flex justify-between border-t border-border pt-4 font-semibold text-base">
            <span>Итого</span>
            <span className="tabular-nums">
              {shipping === null ? formatRub(totalCopecks) : formatRub(grandTotal)}
            </span>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending || quotePending || shipping === null}
          >
            {isPending ? "Оформляем…" : "Оформить заказ"}
          </Button>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            Test/demo: перед production здесь появятся версии оферты и согласий.
          </p>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Field — label + input + inline error
// ---------------------------------------------------------------------------
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string | undefined;
  required?: boolean | undefined;
  help?: string | undefined;
}

function Field({ label, name, error, required = true, help, ...inputProps }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-muted-foreground">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        {...inputProps}
      />
      {error && (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
      {!error && help && (
        <p id={`${name}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useCart } from "@/modules/cart";
import { checkoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRub } from "@/lib/utils/money";
import { imageUrl } from "@/lib/utils/images";
import { ShoppingBag } from "lucide-react";
import { urls } from "@/lib/utils/urls";

// ---------------------------------------------------------------------------
// CheckoutForm — full checkout page body.
// Cart items are serialised into a hidden input (BigInt → string) so they
// survive the FormData transport to the server action.
// ---------------------------------------------------------------------------
export function CheckoutForm() {
  const { items, totalCopecks } = useCart();
  const [state, action, isPending] = useActionState(checkoutAction, null);

  const cartItemsJson = JSON.stringify(
    items.map((i) => ({ ...i, priceCopecks: i.priceCopecks.toString() }))
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <ShoppingBag className="h-14 w-14 text-muted-foreground/25" />
        <div className="space-y-1">
          <p className="text-lg font-medium">Корзина пуста</p>
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
    <form action={action} className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
      <input type="hidden" name="cartItems" value={cartItemsJson} />

      {/* ---- Left: form fields ---- */}
      <div className="space-y-8">
        {state?.message && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.message}
          </div>
        )}

        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold">Контактные данные</h2>
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

        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold">Адрес доставки</h2>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Регион / область"
                name="region"
                placeholder="Московская область"
                autoComplete="address-level1"
                error={state?.errors?.region?.[0]}
              />
              <Field
                label="Город"
                name="city"
                placeholder="Москва"
                autoComplete="address-level2"
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

        <section className="space-y-2">
          <Label htmlFor="note">
            Комментарий{" "}
            <span className="text-muted-foreground font-normal">(необязательно)</span>
          </Label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Пожелания по доставке, удобное время и т.д."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </section>
      </div>

      {/* ---- Right: order summary ---- */}
      <div className="lg:sticky lg:top-24 rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Ваш заказ</h2>
        </div>

        <ul className="divide-y divide-border px-5">
          {items.map((item) => (
            <li key={item.variantId} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={imageUrl(item.imageS3Key)}
                  alt={item.productName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
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
              <span className="text-muted-foreground text-xs leading-5">уточняется</span>
            </div>
          </div>

          <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
            <span>Итого</span>
            <span className="tabular-nums">{formatRub(totalCopecks)}</span>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Оформляем…" : "Оформить заказ"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Нажимая кнопку, вы соглашаетесь с условиями оферты
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
}

function Field({ label, name, error, required = true, ...inputProps }: FieldProps) {
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
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        {...inputProps}
      />
      {error && (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

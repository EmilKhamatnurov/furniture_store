"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { urls } from "@/lib/utils/urls";
import { registerAction } from "../actions";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, null);
  const fe = state?.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Имя" name="firstName" autoComplete="given-name" error={fe?.firstName?.[0]} />
        <Field label="Фамилия" name="lastName" autoComplete="family-name" error={fe?.lastName?.[0]} />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="ivan@example.com"
        error={fe?.email?.[0]}
      />

      <Field
        label="Телефон"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+7 999 000 00 00"
        required={false}
        error={fe?.phone?.[0]}
      />

      <Field
        label="Пароль"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Не короче 8 символов"
        error={fe?.password?.[0]}
      />

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span className="text-muted-foreground">
            Я согласен на обработку персональных данных в соответствии с{" "}
            <Link href={urls.page("privacy")} className="text-primary hover:underline">
              политикой конфиденциальности
            </Link>
          </span>
        </label>
        {fe?.consent && <p className="text-xs text-destructive">{fe.consent[0]}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>
    </form>
  );
}

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
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        {...inputProps}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

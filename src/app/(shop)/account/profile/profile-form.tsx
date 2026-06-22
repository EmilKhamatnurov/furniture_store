"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "../actions";

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export function ProfileForm({ firstName, lastName, phone, email }: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateProfileAction, null);
  const fe = state?.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Изменения сохранены
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Имя</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={firstName}
            autoComplete="given-name"
            required
            aria-invalid={!!fe?.firstName}
          />
          {fe?.firstName && <p className="text-xs text-destructive">{fe.firstName[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Фамилия</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={lastName}
            autoComplete="family-name"
            required
            aria-invalid={!!fe?.lastName}
          />
          {fe?.lastName && <p className="text-xs text-destructive">{fe.lastName[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          autoComplete="tel"
          placeholder="+7 999 000 00 00"
          aria-invalid={!!fe?.phone}
        />
        {fe?.phone && <p className="text-xs text-destructive">{fe.phone[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Email изменить нельзя</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}

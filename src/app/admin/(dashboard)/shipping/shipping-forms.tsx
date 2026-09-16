"use client";

import { useActionState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveZoneAction,
  addTariffAction,
  updateTariffAction,
  deleteTariffAction,
  saveDivisorAction,
} from "./actions";

// --- Divisor ---------------------------------------------------------------
export function DivisorForm({ divisor }: { divisor: number }) {
  const [state, action, pending] = useActionState(saveDivisorAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="divisor">Объёмный делитель (см³ → кг)</Label>
        <Input
          id="divisor"
          name="divisor"
          type="number"
          min="1"
          step="1"
          defaultValue={divisor}
          className="w-32"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Сохранить"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="w-full text-xs text-green-600">Сохранено</p>}
    </form>
  );
}

// --- Zone create/edit ------------------------------------------------------
interface ZoneFormProps {
  id?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function ZoneForm({ id, name, sortOrder, isActive }: ZoneFormProps) {
  const [state, action, pending] = useActionState(saveZoneAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {id && <input type="hidden" name="id" value={id} />}
      <div className="flex-1 min-w-[180px] space-y-1.5">
        <Label>Название зоны</Label>
        <Input name="name" defaultValue={name} placeholder="Москва (в пределах МКАД)" required />
      </div>
      <div className="space-y-1.5">
        <Label>Порядок</Label>
        <Input name="sortOrder" type="number" min="0" defaultValue={sortOrder ?? 0} className="w-20" />
      </div>
      <label className="flex items-center gap-1.5 text-sm pb-2">
        <input type="checkbox" name="isActive" defaultChecked={isActive ?? true} className="h-4 w-4 rounded border-input" />
        Активна
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "…" : id ? "Сохранить" : "Добавить зону"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="w-full text-xs text-green-600">Сохранено</p>}
    </form>
  );
}

// --- Tariff row (edit + delete) --------------------------------------------
interface TariffRowProps {
  tariffId: string;
  maxWeightKg: number;
  priceRub: number;
  extraPerKgRub: number;
  isActive: boolean;
}

export function TariffRow(props: TariffRowProps) {
  const [state, action, pending] = useActionState(updateTariffAction, null);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border px-3 py-2">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="tariffId" value={props.tariffId} />
        <label className="text-xs text-muted-foreground">
          до, кг
          <Input name="maxWeightKg" type="number" min="1" defaultValue={props.maxWeightKg} className="mt-1 h-9 w-20" />
        </label>
        <label className="text-xs text-muted-foreground">
          цена, ₽
          <Input name="priceRub" type="number" min="0" step="1" defaultValue={props.priceRub} className="mt-1 h-9 w-24" />
        </label>
        <label className="text-xs text-muted-foreground">
          +₽/кг сверх
          <Input name="extraPerKgRub" type="number" min="0" step="1" defaultValue={props.extraPerKgRub} className="mt-1 h-9 w-20" />
        </label>
        <label className="flex items-center gap-1.5 text-xs pb-2">
          <input type="checkbox" name="isActive" defaultChecked={props.isActive} className="h-4 w-4 rounded border-input" />
          Акт.
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "…" : "Сохранить"}
        </Button>
      </form>
      <form action={deleteTariffAction}>
        <input type="hidden" name="tariffId" value={props.tariffId} />
        <Button type="submit" size="sm" variant="ghost" className="text-destructive pb-2" title="Удалить">
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

// --- Add tariff bracket ----------------------------------------------------
export function AddTariffForm({ zoneId }: { zoneId: string }) {
  const [state, action, pending] = useActionState(addTariffAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="zoneId" value={zoneId} />
      <label className="text-xs text-muted-foreground">
        до, кг
        <Input name="maxWeightKg" type="number" min="1" placeholder="10" className="mt-1 h-9 w-20" required />
      </label>
      <label className="text-xs text-muted-foreground">
        цена, ₽
        <Input name="priceRub" type="number" min="0" step="1" placeholder="500" className="mt-1 h-9 w-24" required />
      </label>
      <label className="text-xs text-muted-foreground">
        +₽/кг сверх
        <Input name="extraPerKgRub" type="number" min="0" step="1" placeholder="0" className="mt-1 h-9 w-20" />
      </label>
      <Button type="submit" size="sm" variant="outline" className="gap-1" disabled={pending}>
        <Plus className="h-3.5 w-3.5" /> {pending ? "…" : "Бракет"}
      </Button>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

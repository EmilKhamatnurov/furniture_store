"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { updateOrderStatusAction } from "../../actions";
import type { OrderStatus } from "@/modules/orders/db/schema";

interface Props {
  orderId: string;
  options: OrderStatus[]; // allowed transitions
}

export function OrderStatusForm({ orderId, options }: Props) {
  const [state, action, isPending] = useActionState(updateOrderStatusAction, null);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Заказ в финальном статусе — изменение недоступно.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">Статус обновлён</p>}

      <div className="space-y-1.5">
        <Label htmlFor="status">Новый статус</Label>
        <select
          id="status"
          name="status"
          defaultValue={options[0]}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status-note">Комментарий (необязательно)</Label>
        <input
          id="status-note"
          name="note"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Напр. трек-номер"
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Изменить статус"}
      </Button>
    </form>
  );
}

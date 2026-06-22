"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addOrderNoteAction } from "../../actions";

export function NoteForm({ orderId }: { orderId: string }) {
  const [state, action, isPending] = useActionState(addOrderNoteAction, null);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="note"
        rows={2}
        required
        placeholder="Внутренняя заметка…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-600">Заметка добавлена</p>}
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Добавляем…" : "Добавить заметку"}
      </Button>
    </form>
  );
}

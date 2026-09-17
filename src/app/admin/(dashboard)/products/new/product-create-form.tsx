"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProductAction } from "../../actions";

interface ProductCreateFormProps {
  categories: Array<{ id: string; name: string }>;
}

export function ProductCreateForm({ categories }: ProductCreateFormProps) {
  const [state, action, isPending] = useActionState(createProductAction, null);

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Название</Label>
          <Input id="name" name="name" required placeholder="Например, ТВ-тумба 1600" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" name="slug" required placeholder="tv-tumba-1600" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Краткое описание</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Материал, конструкция и другие подтверждённые сведения."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="priceRub">Цена от, ₽</Label>
          <Input id="priceRub" name="priceRub" type="number" min="0" step="1" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Категория</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Товар создаётся скрытым. На следующем шаге добавьте SKU и фото, затем включите публикацию.
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Создаём…" : "Создать черновик"}
      </Button>
    </form>
  );
}

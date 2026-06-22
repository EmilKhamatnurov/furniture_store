"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProductAction } from "../../actions";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  productId: string;
  name: string;
  description: string;
  priceRub: number;
  categoryId: string;
  isActive: boolean;
  isArchived: boolean;
  categories: Category[];
}

export function ProductForm(props: ProductFormProps) {
  const [state, action, isPending] = useActionState(updateProductAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={props.productId} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">Сохранено</p>}

      <div className="space-y-1.5">
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" defaultValue={props.name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Описание</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={props.description}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="priceRub">Базовая цена, ₽</Label>
          <Input
            id="priceRub"
            name="priceRub"
            type="number"
            min="0"
            step="1"
            defaultValue={props.priceRub}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Категория</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={props.categoryId}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10"
          >
            {props.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={props.isActive}
            className="h-4 w-4 rounded border-input"
          />
          Активен (виден на сайте)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isArchived"
            defaultChecked={props.isArchived}
            className="h-4 w-4 rounded border-input"
          />
          В архиве
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить товар"}
      </Button>
    </form>
  );
}

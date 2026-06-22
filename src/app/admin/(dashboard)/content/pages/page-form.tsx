"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePageAction } from "../actions";

interface PageFormProps {
  id?: string;
  slug?: string;
  title?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

export function PageForm(props: PageFormProps) {
  const [state, action, isPending] = useActionState(savePageAction, null);

  return (
    <form action={action} className="space-y-5 max-w-2xl">
      {props.id && <input type="hidden" name="id" value={props.id} />}

      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Заголовок</Label>
          <Input id="title" name="title" defaultValue={props.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={props.slug}
            placeholder="delivery"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Содержимое (HTML)</Label>
        <textarea
          id="body"
          name="body"
          rows={14}
          defaultValue={props.body}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="<h2>Заголовок</h2><p>Текст…</p>"
        />
        <p className="text-xs text-muted-foreground">
          Поддерживается HTML: заголовки h2/h3, абзацы, списки, ссылки, таблицы.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
        <Input id="metaTitle" name="metaTitle" defaultValue={props.metaTitle} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          rows={2}
          defaultValue={props.metaDescription}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={props.isPublished}
          className="h-4 w-4 rounded border-input"
        />
        Опубликовать (видна на сайте)
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}

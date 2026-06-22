"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  requireAdmin,
  createPageAdmin,
  updatePageAdmin,
  createPostAdmin,
  updatePostAdmin,
} from "@/modules/admin";

export interface ContentState {
  error?: string;
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const pageSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, "Введите slug")
    .regex(slugRegex, "Slug: строчные латинские буквы, цифры и дефис"),
  title: z.string().min(2, "Введите заголовок"),
  body: z.string().min(1, "Добавьте содержимое"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.string().optional(), // "on"
});

export async function savePageAction(
  _prev: ContentState | null,
  formData: FormData
): Promise<ContentState> {
  await requireAdmin();

  const parsed = pageSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  const d = parsed.data;
  const values = {
    slug: d.slug,
    title: d.title,
    body: d.body,
    metaTitle: d.metaTitle?.trim() ? d.metaTitle : null,
    metaDescription: d.metaDescription?.trim() ? d.metaDescription : null,
    isPublished: d.isPublished === "on",
  };

  try {
    if (d.id) {
      await updatePageAdmin(d.id, values);
    } else {
      await createPageAdmin(values);
    }
  } catch (err) {
    console.error("[admin] savePage failed:", err);
    return { error: "Не удалось сохранить. Возможно, slug уже занят." };
  }

  revalidatePath(`/${d.slug}`);
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

const postSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, "Введите slug")
    .regex(slugRegex, "Slug: строчные латинские буквы, цифры и дефис"),
  title: z.string().min(2, "Введите заголовок"),
  excerpt: z.string().optional(),
  body: z.string().min(1, "Добавьте содержимое"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.string().optional(),
});

export async function savePostAction(
  _prev: ContentState | null,
  formData: FormData
): Promise<ContentState> {
  await requireAdmin();

  const parsed = postSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }

  const d = parsed.data;
  const values = {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt?.trim() ? d.excerpt : null,
    body: d.body,
    metaTitle: d.metaTitle?.trim() ? d.metaTitle : null,
    metaDescription: d.metaDescription?.trim() ? d.metaDescription : null,
    isPublished: d.isPublished === "on",
  };

  try {
    if (d.id) {
      await updatePostAdmin(d.id, values);
    } else {
      await createPostAdmin(values);
    }
  } catch (err) {
    console.error("[admin] savePost failed:", err);
    return { error: "Не удалось сохранить. Возможно, slug уже занят." };
  }

  revalidatePath(`/blog/${d.slug}`);
  revalidatePath("/blog");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

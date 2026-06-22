import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPageAdmin } from "@/modules/admin";
import { PageForm } from "../page-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function AdminPageEditor({ params }: PageProps) {
  const { pageId } = await params;
  const isNew = pageId === "new";

  const page = isNew ? null : await getPageAdmin(pageId);
  if (!isNew && !page) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К контенту
      </Link>

      <h1 className="font-serif text-2xl md:text-3xl font-semibold">
        {isNew ? "Новая страница" : page!.title}
      </h1>

      {page ? (
        <PageForm
          id={page.id}
          slug={page.slug}
          title={page.title}
          body={page.body}
          metaTitle={page.metaTitle ?? ""}
          metaDescription={page.metaDescription ?? ""}
          isPublished={page.isPublished}
        />
      ) : (
        <PageForm />
      )}
    </div>
  );
}

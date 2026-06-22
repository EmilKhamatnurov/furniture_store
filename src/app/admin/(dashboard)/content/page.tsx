import Link from "next/link";
import { Plus, FileText, Newspaper } from "lucide-react";
import { listPagesAdmin, listPostsAdmin } from "@/modules/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Контент" };

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AdminContentPage() {
  const [pages, posts] = await Promise.all([listPagesAdmin(), listPostsAdmin()]);

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Контент</h1>

      {/* Static pages */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Страницы
          </h2>
          <Button asChild size="sm">
            <Link href="/admin/content/pages/new">
              <Plus className="h-4 w-4" /> Новая страница
            </Link>
          </Button>
        </div>
        <ContentTable
          rows={pages.map((p) => ({
            id: p.id,
            title: p.title,
            sub: `/${p.slug}`,
            published: p.isPublished,
            updatedAt: p.updatedAt,
            href: `/admin/content/pages/${p.id}`,
          }))}
          empty="Страниц нет"
        />
      </section>

      {/* Blog posts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Newspaper className="h-4 w-4" /> Статьи блога
          </h2>
          <Button asChild size="sm">
            <Link href="/admin/content/posts/new">
              <Plus className="h-4 w-4" /> Новая статья
            </Link>
          </Button>
        </div>
        <ContentTable
          rows={posts.map((p) => ({
            id: p.id,
            title: p.title,
            sub: `/blog/${p.slug}`,
            published: p.isPublished,
            updatedAt: p.updatedAt,
            href: `/admin/content/posts/${p.id}`,
          }))}
          empty="Статей нет"
        />
      </section>
    </div>
  );

  function ContentTable({
    rows,
    empty,
  }: {
    rows: Array<{
      id: string;
      title: string;
      sub: string;
      published: boolean;
      updatedAt: Date;
      href: string;
    }>;
    empty: string;
  }) {
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-6 text-center">
          {empty}
        </p>
      );
    }
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Заголовок</th>
              <th className="px-4 py-2.5 font-medium">URL</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
              <th className="px-4 py-2.5 font-medium">Изменён</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5">
                  <Link href={r.href} className="font-medium text-primary hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                  {r.sub}
                </td>
                <td className="px-4 py-2.5">
                  {r.published ? (
                    <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                      Опубликован
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                      Черновик
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {dateFmt.format(r.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

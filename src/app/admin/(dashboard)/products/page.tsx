import Link from "next/link";
import { listAllProductsAdmin } from "@/modules/admin";
import { formatRub } from "@/lib/utils/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Товары" };

export default async function AdminProductsPage() {
  const products = await listAllProductsAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl font-semibold">Товары</h1>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-8 text-center">
          Товаров нет. Добавьте их через сидер: <code>npm run db:seed</code>
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Название</th>
                <th className="px-4 py-2.5 font-medium">Категория</th>
                <th className="px-4 py-2.5 font-medium">Цена от</th>
                <th className="px-4 py-2.5 font-medium">Остаток</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const totalStock = p.variants.reduce((n, v) => n + v.stockQuantity, 0);
                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.variants.length} вар.
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {p.category.name}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                      {formatRub(p.basePriceCopecks)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{totalStock}</td>
                    <td className="px-4 py-2.5">
                      {p.isArchived ? (
                        <Badge tone="danger">Архив</Badge>
                      ) : p.isActive ? (
                        <Badge tone="success">Активен</Badge>
                      ) : (
                        <Badge tone="warning">Скрыт</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const cls = {
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

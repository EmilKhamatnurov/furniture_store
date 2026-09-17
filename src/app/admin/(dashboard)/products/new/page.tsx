import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategoriesAdmin } from "@/modules/admin";
import { ProductCreateForm } from "./product-create-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новый товар" };

export default async function AdminNewProductPage() {
  const categories = await listCategoriesAdmin();
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Все товары
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-semibold md:text-3xl">Новый товар</h1>
        <p className="mt-2 text-sm text-muted-foreground">Сначала создайте безопасный черновик, затем наполните его вариантами и медиа.</p>
      </div>
      <ProductCreateForm categories={categories.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}

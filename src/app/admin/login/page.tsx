import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/admin";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход — Админ-панель",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-serif text-2xl font-semibold">Админ-панель</h1>
          <p className="text-sm text-muted-foreground">KHAMATNUROV MEBEL</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}

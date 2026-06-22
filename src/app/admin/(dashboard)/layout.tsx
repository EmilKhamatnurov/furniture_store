import type { Metadata } from "next";
import { requireAdmin } from "@/modules/admin";
import { AdminSidebar } from "./admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Админ-панель", template: "%s — Админ" },
  robots: { index: false, follow: false },
};

// Guards every /admin/* route except /admin/login (which lives outside this group).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminEmail = await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex">
        <AdminSidebar adminEmail={adminEmail} />
        <main className="flex-1 min-w-0 px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

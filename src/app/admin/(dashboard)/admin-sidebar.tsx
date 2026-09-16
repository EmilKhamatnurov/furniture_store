"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  Truck,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { adminLogoutAction } from "./actions";

const links = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingCart, exact: false },
  { href: "/admin/products", label: "Товары", icon: Package, exact: false },
  { href: "/admin/payments", label: "Платежи", icon: CreditCard, exact: false },
  { href: "/admin/shipping", label: "Доставка", icon: Truck, exact: false },
  { href: "/admin/content", label: "Контент", icon: FileText, exact: false },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-border bg-background flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <p className="font-serif text-lg font-semibold leading-tight">Админ</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{adminEmail}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Открыть сайт
        </Link>
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}

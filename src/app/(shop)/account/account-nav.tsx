"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { urls } from "@/lib/utils/urls";
import { logoutAction } from "./actions";

interface AccountNavProps {
  firstName: string;
  lastName: string;
  email: string;
}

const links = [
  { href: urls.account(), label: "Обзор", icon: User, exact: true },
  { href: urls.accountOrders(), label: "Мои заказы", icon: Package, exact: false },
  { href: urls.accountProfile(), label: "Профиль", icon: Settings, exact: false },
];

export function AccountNav({ firstName, lastName, email }: AccountNavProps) {
  const pathname = usePathname();

  return (
    <aside className="space-y-6">
      <div className="space-y-0.5">
        <p className="font-medium">
          {firstName} {lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>

      <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
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

        <form action={logoutAction} className="contents">
          <button
            type="submit"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Выйти
          </button>
        </form>
      </nav>
    </aside>
  );
}

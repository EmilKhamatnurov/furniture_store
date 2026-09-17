import Link from "next/link";
import { User } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/modules/catalog";
import { getCurrentCustomer } from "@/modules/customers";
import { urls } from "@/lib/utils/urls";
import { CartButton } from "@/modules/cart/ui/cart-button";

// ---------------------------------------------------------------------------
// Site header — server component, fetches category tree for the menu
// ---------------------------------------------------------------------------
export async function SiteHeader() {
  const [categories, customer] = await Promise.all([
    getCategoryTree(),
    getCurrentCustomer(),
  ]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container>
        <div className="flex h-[4.5rem] items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href={urls.home()}
              className="font-serif text-base tracking-[0.12em] text-foreground whitespace-nowrap md:text-lg"
            >
              KHAMATNUROV<span className="text-oak"> MEBEL</span>
            </Link>

            <nav
              aria-label="Главное меню"
              className="hidden items-center gap-7 md:flex"
            >
              <Link
                href={urls.catalog()}
                className="text-xs font-semibold uppercase tracking-[0.09em] hover:text-pine transition-colors"
              >
                Каталог
              </Link>
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={urls.category(cat.slug)}
                  className="text-xs font-semibold uppercase tracking-[0.09em] hover:text-pine transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href={urls.blog()}
                className="text-xs font-semibold uppercase tracking-[0.09em] hover:text-pine transition-colors"
              >
                Блог
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={urls.catalog()} className="mr-1 text-xs font-semibold uppercase tracking-[0.09em] md:hidden">
              Каталог
            </Link>
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label={customer ? "Личный кабинет" : "Войти"}
            >
              <Link href={customer ? urls.account() : urls.login()}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <CartButton />
          </div>
        </div>
      </Container>
    </header>
  );
}

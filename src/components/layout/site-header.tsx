import Link from "next/link";
import { Menu, User } from "lucide-react";
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
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href={urls.home()}
              className="font-serif text-lg md:text-xl font-semibold tracking-[0.12em] text-foreground whitespace-nowrap"
            >
              KHAMATNUROV<span className="text-muted-foreground"> MEBEL</span>
            </Link>

            <nav
              aria-label="Главное меню"
              className="hidden md:flex items-center gap-6"
            >
              <Link
                href={urls.catalog()}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Каталог
              </Link>
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={urls.category(cat.slug)}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href={urls.blog()}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Блог
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}

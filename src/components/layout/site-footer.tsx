import Link from "next/link";
import { Container } from "@/components/ui/container";
import { urls } from "@/lib/utils/urls";

// ---------------------------------------------------------------------------
// Site footer — includes legal info required for IE in RF:
// - INN, OGRNIP (placeholder values, replace via env or content table)
// - links to public offer, privacy policy, returns
// ---------------------------------------------------------------------------
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-pine text-pine-foreground mt-20">
      <Container>
        <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 font-serif text-lg tracking-[0.1em] text-pine-foreground">
              KHAMATNUROV MEBEL
            </div>
            <p className="text-sm leading-relaxed text-pine-foreground/65">
              Тестовая витрина предметной мебели. Уфа.
            </p>
          </div>

          <div>
            <h3 className="eyebrow mb-4 text-pine-foreground/50">Магазин</h3>
            <ul className="space-y-2 text-sm text-pine-foreground/65">
              <li>
                <Link
                  href={urls.catalog()}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href={urls.blog()}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Блог
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("delivery")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Доставка и&nbsp;оплата
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("returns")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Возврат и&nbsp;обмен
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4 text-pine-foreground/50">Информация</h3>
            <ul className="space-y-2 text-sm text-pine-foreground/65">
              <li>
                <Link
                  href={urls.page("about")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  О&nbsp;нас
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("contacts")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("offer")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("privacy")}
                  className="hover:text-pine-foreground transition-colors"
                >
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4 text-pine-foreground/50">Статус</h3>
            <div className="space-y-1 text-sm text-pine-foreground/65">
              <p>Dev / demo</p>
              <p>Реквизиты — до production</p>
              <p>Платёж — sandbox</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-pine-foreground/20 py-6 text-xs text-pine-foreground/55 sm:flex-row">
          <p>© {year} KHAMATNUROV MEBEL. Все&nbsp;права защищены.</p>
          <p>
            Сайт носит информационный характер и&nbsp;не&nbsp;является публичной офертой.
          </p>
        </div>
      </Container>
    </footer>
  );
}

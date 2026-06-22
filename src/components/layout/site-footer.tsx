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
    <footer className="border-t border-border bg-secondary/30 mt-20">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-serif text-lg font-semibold tracking-[0.1em] text-foreground mb-3">
              KHAMATNUROV MEBEL
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Серийная мебель ручной работы. Доставка по Москве и&nbsp;области.
            </p>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Магазин</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={urls.catalog()}
                  className="hover:text-foreground transition-colors"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href={urls.blog()}
                  className="hover:text-foreground transition-colors"
                >
                  Блог
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("delivery")}
                  className="hover:text-foreground transition-colors"
                >
                  Доставка и&nbsp;оплата
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("returns")}
                  className="hover:text-foreground transition-colors"
                >
                  Возврат и&nbsp;обмен
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Информация</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={urls.page("about")}
                  className="hover:text-foreground transition-colors"
                >
                  О&nbsp;нас
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("contacts")}
                  className="hover:text-foreground transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("offer")}
                  className="hover:text-foreground transition-colors"
                >
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link
                  href={urls.page("privacy")}
                  className="hover:text-foreground transition-colors"
                >
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Реквизиты</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ИП Фамилия Имя Отчество</p>
              <p>ИНН: 000000000000</p>
              <p>ОГРНИП: 000000000000000</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <p>© {year} KHAMATNUROV MEBEL. Все&nbsp;права защищены.</p>
          <p>
            Сайт носит информационный характер и&nbsp;не&nbsp;является публичной офертой.
          </p>
        </div>
      </Container>
    </footer>
  );
}

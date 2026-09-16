# KHAMATNUROV MEBEL — Источники исследования и принятые выводы

Версия 1.0 • 17 сентября 2026

Этот файл фиксирует внешние источники, использованные для усиления ТЗ. Даты и требования необходимо перепроверять перед production, если между проектированием и запуском проходит значительное время.

## 1. Next.js — Security Release, 25 августа 2026

Источник: официальный блог Next.js, раздел Security.

URL: https://nextjs.org/blog

На странице релизов указано, что 25 августа 2026 опубликован August 2026 Security Release; рекомендуется обновление до Next.js 16.3.3 (Active LTS) или 15.5.24 (Maintenance LTS) для устранения двух Critical severity vulnerabilities.

**Применение в проекте:** текущая найденная версия 15.5.19 не должна оставаться production baseline. Security patch — P0 до крупного продуктового рефакторинга.

---

## 2. Google Search Central — Product Variants

Источник: Google Developers.

URL: https://developers.google.com/search/docs/appearance/structured-data/product-variants

Ключевые положения:

- мебель прямо приведена как тип товара с вариантами размера/цвета/материала;
- использовать `ProductGroup`, `variesBy`, `hasVariant`, `productGroupID` и variant `Product`;
- для single-page вариантов должен быть один canonical ProductGroup URL;
- каждый variant должен иметь уникальный ID;
- вариант должен быть доступен по distinct URL, например query parameters, который предвыбирает правильные image/price/availability;
- желательно иметь Product data в initial HTML.

**Применение:** одна карточка модели + query variant selection + base canonical + server JSON-LD.

---

## 3. Google — Ecommerce URL Structure

URL: https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites

Ключевые положения:

- уменьшать число альтернативных URL одинакового содержания;
- variants могут идентифицироваться path/query;
- query variant canonical ведет на product URL без selector;
- indexable pages используют self-canonical;
- links должны быть обычными `<a href>`;
- пустые категории не стоит индексировать.

**Применение:** стабильные slugs, query variants, canonical policy, crawlable navigation.

---

## 4. Google — Ecommerce Site Structure

URL: https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure

Ключевые положения:

- Google понимает относительную важность страниц через ссылки;
- рекомендуется menu → category → subcategory → product;
- товары должны быть достижимы crawlable links;
- important products/categories стоит внутренне усиливать.

**Применение:** каталог не зависит от JS-search/filter для discovery; breadcrumbs/related/editorial links.

---

## 5. Google — Faceted Navigation

URL: https://developers.google.com/crawling/docs/faceted-navigation

И дополнительный обзор: https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav

Ключевые положения:

- faceted navigation может создавать практически бесконечное URL-space;
- это ведет к overcrawling и более медленному discovery;
- если faceted URLs не нужны в индексе, их crawl рекомендуется ограничивать;
- canonical/nofollow возможны как сигналы, но robots-based prevention эффективнее для явно ненужного crawl;
- zero-result combinations должны корректно обрабатываться.

**Применение:** filters UX-first, index by whitelist landing pages, не auto-index каждой комбинации.

---

## 6. Yandex Webmaster — Product information

Русская справка:
https://yandex.ru/support/webmaster/ru/supported-schemas/goods-prices

Ключевые положения:

- поддерживаются `Product` + `Offer` или `AggregateOffer`;
- требуются name/description/brand/image и offer price/currency/availability;
- `lowPrice` в AggregateOffer показывается как «от N руб.»;
- Яндекс рекомендует minimum price, когда цена зависит от размера/других параметров.

**Применение:** parent model может передавать диапазон/low price, а конкретные variants — Offer.

---

## 7. Yandex Webmaster — YML feeds

URL: https://yandex.ru/support/webmaster/en/feed/upload

И Product snippet:
https://yandex.ru/support/webmaster/en/search-appearance/product

Ключевой вывод: для передачи информации о товарах Яндекс поддерживает YML feed и рекомендует его для расширенного товарного представления.

**Применение:** отдельный feed generator из authoritative catalog data.

---

## 8. ЮKassa — отправка чеков / 54-ФЗ

URL: https://yookassa.ru/docs/support/merchant/payments/implement/online-sales-register

ЮKassa предлагает выбрать способ отправки чеков: «Чеки от ЮKassa» либо другое решение/онлайн-кассу.

**Применение:** production payment не считать завершенным до настройки/теста фискализации и бухгалтерских параметров.

---

## 9. 152-ФЗ — отдельное согласие ПДн

Федеральный закон №156-ФЗ от 24.06.2025, статья 5; изменение вступило в силу 01.09.2025.

Официальное опубликование:
https://publication.pravo.gov.ru/document/0001202506240021

КонсультантПлюс, статья 9 152-ФЗ:
https://www.consultant.ru/document/cons_doc_LAW_61801/6c94959bc017ac80140621762d2ac59f6006b08c/

Норма: согласие на обработку персональных данных должно быть оформлено отдельно от иной информации/документов, которые субъект подтверждает/подписывает.

**Применение:** не объединять ПДн, оферту и рекламу одной checkbox. Финальную схему оснований обработки определяет юрист.

---

## 10. Правила розничной продажи №657

Постановление Правительства РФ от 30.05.2026 №657, действующее с 01.09.2026; актуальную редакцию перед запуском проверить.

КонсультантПлюс:
https://www.consultant.ru/document/cons_doc_LAW_535649/

Раздел дистанционной продажи:
https://www.consultant.ru/document/cons_doc_LAW_535649/5d9db629bd7904808c6c40162d9a98583fe3e3d2/

**Применение:** checkout/offer/order confirmation проектируются с учетом актуальных правил дистанционной розничной продажи; юридическую интерпретацию и документы проверяет профильный специалист.

---

## 11. Web performance / Core Web Vitals

Ориентиры good experience, используемые в ТЗ:

- LCP ≤ 2.5 s;
- INP ≤ 200 ms;
- CLS ≤ 0.1;

Источник: web.dev / Google Core Web Vitals guidance.

**Применение:** performance budgets для image-heavy furniture storefront; реальные RUM метрики после запуска важнее одного Lighthouse run.

---

## 12. Граница веб-исследования

Внешние источники подтверждают технические и SEO/правовые принципы, но не подтверждают бизнес-данные KHAMATNUROV MEBEL: конкретные цены, сроки, гарантии, процент предоплаты, размер доплаты, палитру, способы доставки. Эти сведения должны поступить от владельца/производства/бухгалтера/юриста и остаются открытыми в Decision Log.


# KHAMATNUROV MEBEL — SEO, контент, фиды и аналитика

Версия 1.0 • 17 сентября 2026

## 1. SEO-цель

Сайт строится как индексируемый ecommerce-каталог авторской предметной мебели, а не как имиджевый SPA и не как блог с приставленным каталогом.

SEO закладывается в архитектуру до наполнения:

- стабильное дерево URL;
- серверный HTML;
- управляемая индексация;
- корректные variants;
- внутренняя перелинковка;
- структурированные данные;
- товарные фиды;
- контент, связанный с коммерческими страницами;
- измерение ecommerce funnel.

---

## 2. Исходное семантическое позиционирование

До сбора семантики не фиксировать точные Title/H1 под частотность. Предварительные кластеры:

### Коммерческие

- дизайнерская мебель;
- предметная мебель;
- мебель собственного производства;
- мебель из дуба / дубового шпона — только там, где ассортимент соответствует;
- прикроватные тумбы;
- тумбы под телевизор / TV-тумбы;
- комоды;
- обеденные столы;
- журнальные столики;
- кофейные столики;
- рабочие столы;
- директорские столы;
- стеллажи.

### Информационно-коммерческие

- как выбрать обеденный стол;
- размеры стола;
- массив или шпон;
- натуральный шпон;
- уход за мебелью из дуба;
- лак или масло;
- сочетание мебели с интерьером;
- качество мебели / конструктивные признаки.

### B2B

- изготовление мебели по дизайн-проекту;
- предметная мебель для дизайнеров;
- мебельное производство для дизайнеров/архитекторов.

Не делать заранее страницы «дизайнерская мебель Москва», «столы Санкт-Петербург» и сотни геостраниц без отдельной стратегии, фактического предложения и уникальной ценности.

---

## 3. Информационная архитектура

Целевой skeleton:

```text
/
/catalog/
/catalog/prikrovatnye-tumby/
/catalog/tv-tumby/
/catalog/komody/
/catalog/stoly/
/catalog/stoly/obedennye/        # только при достаточном ассортименте
/catalog/stoly/zhurnalnye/       # аналогично
/catalog/stoly/kofeynye/
/catalog/stoly/rabochie/
/catalog/stoly/direktorskie/
/catalog/stellazhi/
/catalog/{category}/{product}/
/materials/
/materials/dubovyi-shpon/
/materials/massiv-duba/
/materials/mdf-emal/
/designers/
/about/
/production/                     # если есть достаточный отдельный контент
/how-to-order/ или интегрировать в delivery/payment
/delivery-payment/
/warranty/
/blog/
/blog/{slug}/
/contacts/
```

Реальный URL tree утверждается после семантики и инвентаризации ассортимента.

---

## 4. Индексируемые типы страниц

### Index

- home;
- заполненные categories/subcategories;
- active product pages;
- materials pages с самостоятельной ценностью;
- designers;
- about;
- delivery/payment;
- warranty;
- полезные articles;
- contacts.

### Noindex / не попадать в sitemap

- cart;
- checkout;
- payment success/fail;
- account/profile/order history;
- admin;
- internal search results;
- preview/draft CMS;
- service endpoints;
- filter/sort combinations по умолчанию;
- login/reset password;
- empty categories.

`robots.txt` и meta robots решают разные задачи: `noindex` требует возможности crawl страницы. Нельзя бездумно одновременно закрыть URL в robots.txt и ожидать, что бот увидит `noindex`.

---

## 5. Categories и ассортимент

Google рекомендует crawlable иерархию category → subcategory → product через обычные `<a href>` ссылки. Поэтому клиентский JS-filter не может быть единственным способом обнаружить товары.

Правило запуска subcategory:

- есть самостоятельный интент/семантика;
- есть достаточное число релевантных моделей;
- страница имеет отличимый intro/контент;
- товары доступны через HTML links;
- страницу можно поддерживать, когда ассортимент меняется.

Если категория пуста — `noindex` или 404 в зависимости от статуса и жизненного цикла. Google отдельно рекомендует избегать индексирования страниц без полезного контента.

---

## 6. Faceted navigation

Google прямо предупреждает, что фасетная навигация является распространенной причиной практически бесконечного URL-space и overcrawl.

### По умолчанию

Параметры вроде:

```text
?material=oak&color=dark&size=1800&sort=price
```

не являются SEO-посадочными.

Рекомендуемая стратегия:

- whitelist параметров фильтра в приложении;
- deterministic order параметров;
- filter UI может менять URL для usability/share state;
- canonical на базовую indexable category;
- не включать filters в sitemap;
- при подтвержденной проблеме crawl budget — robots rules для конкретных faceted params по официальной рекомендации Google;
- zero-result комбинация не должна возвращать soft-200 с бессмысленным текстом.

### SEO landing filters

Если семантика показывает ценную страницу «обеденные столы из дуба» и ассортимент достаточен — создать **отдельную управляемую landing entity** с чистым URL, SEO-текстом, H1 и закрепленным filter preset, а не индексировать случайный query URL.

---

## 7. Product variants

Для KHAMATNUROV выбран single-page variant model.

Google рекомендует для такого подхода:

- единый canonical URL ProductGroup;
- возможность напрямую открыть конкретный вариант уникальным URL/query и получить правильные image/price/availability;
- `ProductGroup` + variant `Product`;
- уникальные идентификаторы variants;
- `variesBy`.

Для мебели применимы поддерживаемые свойства:

- `size`;
- `color`;
- `material`;
- при необходимости `pattern`; отделка, не имеющая прямого поддерживаемого axis, может быть дополнительно описана через `additionalProperty`, но не подменять обязательные поддерживаемые свойства.

Markup желательно отдавать в initial server HTML, особенно цену/availability.

---

## 8. Schema.org / JSON-LD

### Home

- `Organization`;
- `WebSite`;
- `BreadcrumbList` не нужен на home;
- `SearchAction` только если site search реально работает и соответствует рекомендациям поисковика.

### Category

- `BreadcrumbList`;
- `CollectionPage`/`ItemList` можно использовать как семантическое дополнение, но не ожидать ecommerce rich result от списка разных товаров.

### Product

Google layer:

- `ProductGroup`;
- `productGroupID`;
- `variesBy`;
- `hasVariant` Product[];
- each variant SKU;
- image;
- brand;
- material/color/size;
- Offer with URL, price, priceCurrency, availability.

Yandex compatibility:

Яндекс поддерживает `Product` + `Offer` либо `AggregateOffer`; при переменной цене `lowPrice` позволяет показать цену «от N руб.» и прямо рекомендуется, если цена зависит от размера/параметров.

Практический вариант:

- строить корректный Schema.org graph, совместимый с Google ProductGroup;
- обеспечить, чтобы Product/Product variants содержали Offers;
- на уровне parent product при необходимости давать AggregateOffer с low/high price для Яндекса, не создавая противоречащих цен;
- проверять Google Rich Results и валидатор Яндекса на staging sample pages.

### Article

- `Article`/`BlogPosting`;
- author только реальный;
- datePublished/dateModified;
- image;
- publisher.

### Breadcrumbs

`BreadcrumbList` на всех вложенных indexable pages.

### FAQ

Не строить SEO вокруг FAQ rich results. Использовать FAQ только для реальной помощи, а structured data — только если соответствует текущим правилам поисковика.

---

## 9. Metadata

Каждая indexable entity должна иметь editable/fallback:

```text
H1
Title
Description
canonical
robots
OG title
OG description
OG image
```

Fallback examples не являются финальной SEO-оптимизацией:

```text
Product title: {Product name} — купить предметную мебель KHAMATNUROV MEBEL
Category title: {Category H1} — KHAMATNUROV MEBEL
```

После семантики templates корректируются.

Не вставлять «Уфа» во все Title, если продукт доставляется по России и запрос не локальный. Уфа важна для производства/contacts/local trust, но не должна искусственно ограничивать федеральную коммерческую страницу.

---

## 10. Canonical

- indexable pages self-canonical;
- product query variant → base product canonical;
- sort/filter → category canonical, если URL не whitelist landing;
- tracking params не меняют canonical;
- pagination должна иметь self-canonical на каждую реальную page, если используется pagination URL;
- нельзя canonical-ить содержательно разные indexable categories на родителя.

---

## 11. Pagination / Load more

Можно сделать визуальный «Показать еще»/infinite UI, но поисковые роботы должны иметь crawlable paginated URLs и links, если ассортимент требует страниц.

Не полагаться на scroll event как единственный способ получить товары.

При маленькой коллекции pagination может вообще не понадобиться.

---

## 12. Sitemap

Индекс sitemap либо один sitemap для малого сайта.

Включать:

- home;
- categories;
- active products;
- materials/content pages;
- articles.

Не включать:

- query variants;
- filters;
- redirects;
- noindex;
- 404;
- draft;
- cart/account/admin.

`lastmod` — дата реального существенного изменения, а не `now()` при каждом запросе sitemap.

---

## 13. Robots.txt

Минимально закрыть технические зоны, но не блокировать CSS/JS/images, необходимые для render.

Перед production убрать staging rules. Staging одновременно защищается auth и `noindex`, чтобы случайное снятие одного слоя не приводило к индексации.

---

## 14. HTTP статусы и redirects

- удаленная модель без аналога → 410/404 после оценки backlinks/traffic;
- замененная модель → 301 на наиболее близкую только при реальном соответствии;
- slug changed → permanent redirect;
- out-of-production товар с полезной историей может оставаться 200 с понятным статусом и alternatives, если страница имеет спрос/ссылки;
- empty arbitrary filter → 404 или корректный non-indexable state, без soft 404.

---

## 15. YML feed

Яндекс рекомендует передавать товарную информацию YML feed для расширенного товарного представления.

Создать server-generated feed endpoint/file:

```text
/yml/catalog.xml
```

Feed строится из тех же ProductVariant/price/availability данных, что и карточка.

Требования:

- стабильные offer id;
- URL варианта с query preselection при необходимости;
- актуальная цена;
- currency RUB;
- реальные images;
- category mapping;
- vendor/brand;
- description без HTML-мусора;
- made-to-order availability отражается согласно поддерживаемой модели YML, после проверки требований выбранного сценария Яндекс Товаров.

Feed generation покрыть validation test и мониторить freshness/error.

---

## 16. Google Merchant / free listings

Рассмотреть после production каталога. Structured data и Merchant feed дополняют друг друга; feed особенно полезен для контроля товарных данных.

Не блокировать запуск core SEO ожиданием Merchant Center, но модель variants должна позволять сформировать feed без переделки БД.

---

## 17. Контент-стратегия

Исходные 30 тем переработать после семантики. Главный критерий: статья должна усиливать компетентность бренда и вести к категории/товару.

Приоритетные кластеры:

### Choice intent

- Как выбрать размер обеденного стола;
- Круглый или прямоугольный стол;
- Как выбрать TV-тумбу;
- Как подобрать комод;
- Рабочий стол для домашнего кабинета.

### Materials expertise

- Натуральный шпон: что это;
- Массив или шпон;
- Дубовый шпон в мебели;
- Масло или лак;
- МДФ в эмали — где уместен;
- уход за дубом/шпоном/эмалью.

### Craft / differentiation

- Что дает запил 45°;
- как подбирают рисунок шпона;
- скрытый крепеж;
- признаки качественной предметной мебели;
- как читать конструкцию изделия.

### Interior

- мебель в современном интерьере;
- сочетание оттенков дерева;
- пропорции мебели и помещения;
- как не перегрузить небольшую гостиную.

Убрать акцент на ЛДСП, если бренд не продает его как ключевой стандартный материал. Такие статьи могут привести нецелевую аудиторию и размывать expertise.

---

## 18. EEAT / доверие

Для продукта с высоким чеком нужны доказательства:

- реальные данные продавца;
- production location;
- автор/редактор экспертных материалов, если реально определен;
- фотографии производства;
- история бренда;
- подробные материалы и уход;
- доставка/оплата/гарантия;
- контакты;
- прозрачный made-to-order срок;
- реальные case studies.

Не создавать фиктивных author personas, отзывов или «экспертных сертификатов».

---

## 19. Image SEO

- descriptive filenames допустимы, но storage key может быть техническим; public delivery URL/metadata не обязаны содержать keyword stuffing;
- meaningful alt описывает изображение в контексте, а не список ключей;
- decorative images alt="";
- width/height;
- srcset/Next Image;
- large product photos доступны в достаточном качестве;
- image sitemap отдельный не обязателен при корректном HTML/sitemap, но можно рассмотреть после анализа индексации.

---

## 20. Internal linking

Минимальные связи:

```text
Home → Categories / featured products
Category → Products
Product → Category + Related products + Materials + relevant article
Article → Category + products + material page
Material → applicable products/categories
Designer cases → Designers CTA
```

Breadcrumbs — HTML + JSON-LD.

Related products должны определяться управляемо (same category/manual relations), а не случайным SQL `ORDER BY random()`.

---

## 21. Analytics event model

Подключить Яндекс Метрику и, если используется, GA4/другой контур после правовой оценки.

Независимо от провайдера определить внутренний dataLayer/event contract:

```text
view_item_list
select_item
view_item
select_variant
add_to_cart
view_cart
begin_checkout
add_shipping_info
add_payment_info
purchase
custom_order_submit
designer_project_submit
contact_click
```

Ecommerce item:

```text
item_id = variant SKU/id
item_group_id = product parentSku/id
item_name
item_category
item_variant = normalized label
price
quantity
```

`purchase` отправляется один раз по подтвержденному order/payment state, а не при простом открытии success URL.

---

## 22. Search Console / Yandex Webmaster launch checklist

До открытия индексации:

- domain verified;
- sitemap submitted;
- robots tested;
- canonical sample tested;
- Product markup validation;
- noindex service routes;
- 404 behavior;
- mobile usability;
- Core Web Vitals baseline;
- YML validation;
- site mirrors/http/https/www policy;
- redirect test;
- analytics ecommerce test order.

После запуска:

- indexing report;
- Merchant/Product enhancement reports;
- crawl errors;
- duplicate/canonical selections;
- snippets;
- branded/non-branded queries;
- Yandex diagnostics;
- feed errors.

---

## 23. Core Web Vitals / technical SEO budget

Google/Web performance target:

- LCP good ≤ 2.5 s;
- INP good ≤ 200 ms;
- CLS good ≤ 0.1 at 75th percentile.

Engineering practices:

- Server Components по умолчанию;
- минимизировать client component boundary;
- dynamic import тяжелых optional widgets;
- не гидрировать весь Product page только ради selector;
- optimize hero/LCP image;
- image dimensions;
- avoid layout-changing webfonts;
- CDN/cache static media;
- performance regression test on key routes.

---

## 24. SEO acceptance checklist для каждой новой страницы

Перед publish:

- 200;
- correct H1;
- unique Title/Description;
- canonical;
- robots;
- breadcrumbs;
- sitemap inclusion/exclusion;
- internal links;
- image alts;
- structured data where applicable;
- no placeholder text;
- mobile render;
- no client-only critical content;
- no duplicate near-empty sibling pages.

---

## 25. Definition of Done SEO MVP

- категории/товары доступны через HTML navigation;
- нет indexable cart/checkout/account/filter explosion;
- variant URL работает, canonical единый;
- ProductGroup/Product/Offer validated на sample products;
- Yandex Product markup validated;
- sitemap/robots корректны;
- YML generated from same price source;
- ecommerce events проходят test order;
- 404/redirect matrix проверена;
- стартовое semantic core собрано до финальных metadata;
- опубликованы минимум core commercial pages и несколько действительно полезных supporting articles, а не 30 AI-статей за один день.


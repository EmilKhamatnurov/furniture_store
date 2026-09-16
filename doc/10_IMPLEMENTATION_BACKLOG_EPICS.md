# KHAMATNUROV MEBEL — Implementation Backlog

Версия: 1.0 • 17 сентября 2026

Этот файл превращает архитектурные документы пакета в исполнимый backlog. Он не заменяет мастер-ТЗ: при конфликте приоритет имеют `01_MASTER_TZ_KHAMATNUROV_MEBEL.md`, профильные документы 02–08 и подтвержденные записи Decision Log.

## Правила выполнения backlog

- P0 — блокирует безопасную разработку или запуск.
- P1 — входит в первый production-релиз.
- P2 — можно перенести после запуска без разрушения базового пользовательского сценария.
- Каждая задача завершается кодом, миграциями/данными при необходимости, тестами, документацией и проверкой на staging.
- Нельзя считать задачу закрытой, если готов только UI без server validation, admin flow, error states и проверки SEO/analytics там, где они применимы.
- Не объединять крупные миграции данных, смену major-версии framework и редизайн в один pull request.

---

# EPIC 0. Baseline, безопасность и контрольная точка

## KM-0001 [P0] Зафиксировать baseline текущего репозитория

**Результат:** воспроизводимый отчет о состоянии проекта до рефакторинга.

Сделать:
- зафиксировать commit SHA;
- сохранить `package.json`, lockfile и список environment variables без значений секретов;
- выполнить production build;
- выполнить существующие unit/integration tests;
- проверить migrations status;
- зафиксировать current DB schema;
- проверить Docker compose / deployment scripts;
- зафиксировать основные публичные маршруты;
- сохранить Lighthouse/PSI baseline ключевых страниц, если production/staging доступен.

**Acceptance:** новый разработчик может поднять текущий проект по документации без устных пояснений.

## KM-0002 [P0] Обновить Next.js в поддерживаемый security patch

Сделать:
- перейти с текущей ветки 15.5 на актуальный исправленный patch минимум 15.5.24 или более новый совместимый maintenance patch;
- не совмещать с миграцией на major 16;
- проверить breaking behavior middleware/proxy, image, metadata, route handlers;
- production build + smoke tests;
- проверить CSP и auth flows.

**Acceptance:** build/test проходят, regression на storefront/admin отсутствует.

## KM-0003 [P0] Резервное копирование до DB refactor

Сделать:
- автоматический dump PostgreSQL;
- off-server storage;
- retention policy;
- документированный restore;
- тестовый restore в отдельную БД.

**Acceptance:** восстановление подтверждено практическим restore drill.

## KM-0004 [P0] Поднять staging

Staging должен иметь:
- отдельную БД;
- отдельный Redis;
- отдельный S3 prefix/bucket;
- отдельные payment/email test credentials;
- запрет индексации;
- отдельные секреты;
- базовую auth-защиту при необходимости.

---

# EPIC 1. Домен каталога v2

## KM-0101 [P0] Утвердить словари опций

Создать бизнес-справочники:
- `size`;
- `material`;
- `color` / `tone`;
- `finish`.

Для каждого значения хранить:
- code;
- displayName;
- shortDisplayName optional;
- description optional;
- sortOrder;
- active;
- media/swatch optional;
- SEO landing eligibility optional.

**Acceptance:** значения не захардкожены в React-компонентах.

## KM-0102 [P0] Развести Product и ProductVariant

`Product` = модель/дизайн изделия.

`ProductVariant` = конкретная продаваемая комбинация параметров с собственной ценой/SKU/availability.

Нельзя:
- создавать отдельный Product для каждого цвета;
- вычислять цену только на клиенте;
- разрешать комбинацию, которой нет в variant matrix.

## KM-0103 [P0] Реализовать связи variant option values

Добавить нормализованную связь между variant и option values либо эквивалентную строго типизированную структуру.

Constraints:
- одна option type не повторяется внутри variant;
- одна и та же комбинация значений не дублируется для одного Product;
- SKU уникален;
- inactive variant не покупается.

## KM-0104 [P1] Привязка медиа к модели/варианту

Поддержать:
- общие фото модели;
- фото конкретного материала/тона;
- optional фото конкретного variant;
- роли изображения;
- sort order;
- alt;
- dimensions;
- focal point optional.

## KM-0105 [P1] Availability model для made-to-order

Минимум:
- active/inactive;
- made_to_order;
- ready_stock future compatible;
- lead time override optional;
- unavailable reason optional.

Не использовать фиктивный остаток `999` для made-to-order товара.

---

# EPIC 2. Миграция существующих данных

## KM-0201 [P0] Инвентаризация legacy catalog data

Сформировать mapping:
- legacy Product -> new Product;
- legacy variant -> new ProductVariant;
- legacy attributes -> option values;
- изображения -> media roles;
- цены -> variant price.

Все неоднозначные строки вынести в manual review report.

## KM-0202 [P0] Additive migrations

Порядок:
1. создать новые таблицы/колонки без удаления legacy;
2. backfill;
3. dual-read/feature flag при необходимости;
4. сверка;
5. переключение storefront/admin;
6. только после периода стабильности cleanup legacy.

## KM-0203 [P0] Data reconciliation

Проверить:
- количество моделей;
- количество variants;
- min price каждой модели;
- SKU uniqueness;
- orphan images;
- inactive products;
- malformed slugs.

---

# EPIC 3. Admin: каталог и конфигуратор

## KM-0301 [P1] Экран редактирования модели

Секции:
- основное;
- категория;
- описание;
- особенности конструкции;
- медиа;
- доступные option values;
- variants;
- SEO;
- related products;
- publication state.

## KM-0302 [P1] Variant Matrix UI

Колонки минимум:
- размер;
- материал;
- оттенок;
- отделка;
- SKU;
- цена;
- active;
- lead time override;
- image status.

Функции:
- добавить;
- дублировать;
- bulk activate/deactivate;
- bulk price change только с confirmation;
- duplicate-combination validation;
- SKU uniqueness validation;
- фильтр по option values;
- показать min price модели.

## KM-0303 [P1] Защита от неполной публикации

Не публиковать модель как purchasable, если:
- нет ни одного active variant;
- нет цены;
- отсутствует mandatory product content;
- нет основного изображения;
- URL конфликтует.

Можно разрешить `draft`/`preview`.

---

# EPIC 4. Дизайн-система и shell

## KM-0401 [P1] Design tokens

Реализовать tokens:
- palette;
- typography;
- spacing;
- grid;
- radii;
- border;
- elevation minimal;
- motion;
- z-index;
- breakpoints.

Не размазывать magic numbers по компонентам.

## KM-0402 [P1] Typography

Подключить локально/self-hosted:
- display serif с кириллицей;
- UI/body sans с кириллицей.

Проверить лицензии и subsetting.

## KM-0403 [P1] Global header

Desktop/mobile:
- wordmark;
- каталог;
- материалы;
- для дизайнеров;
- о бренде;
- поиск future-compatible;
- account;
- cart;
- mobile menu;
- focus states.

## KM-0404 [P1] Footer

Содержит:
- каталог;
- сервисные страницы;
- контакты;
- реквизиты после подтверждения;
- legal links;
- соцсети;
- copyright.

## KM-0405 [P1] Component library

Минимум:
- Button;
- Link;
- SectionHeader;
- ProductCard;
- Price;
- Badge;
- Breadcrumbs;
- Gallery;
- OptionSelector;
- Swatch;
- Accordion;
- Dialog/Drawer;
- FormField;
- Checkbox;
- Radio;
- Quantity;
- Toast;
- EmptyState;
- Pagination;
- FilterDrawer;
- MobilePurchaseBar.

---

# EPIC 5. Главная страница

## KM-0501 [P1] Hero

Контент:
- бренд;
- короткое позиционирование;
- production/Russia shipping claim только в подтвержденной формулировке;
- CTA `Смотреть коллекцию`;
- CTA `Для дизайнеров`.

Фото должно быть контентом, а не декоративным фоном без alt там, где оно смысловое.

## KM-0502 [P1] Коллекция

Крупные визуальные переходы в реальные индексируемые категории. Нельзя делать плитки без crawlable `<a href>`.

## KM-0503 [P1] Product highlight

Одна/несколько флагманских моделей с реальной min price и ссылкой на PDP.

## KM-0504 [P1] Materials & craft

Показать:
- дубовый шпон;
- массив дуба;
- МДФ в эмали;
- реальные отделки;
- 45°/подбор шпона только для моделей, где это действительно применимо.

## KM-0505 [P1] Designers CTA

Отдельный B2B-маршрут без смешивания с обычным checkout.

## KM-0506 [P1] Brand story

Три поколения как доказательство происхождения компетенции, без перегрузки главной биографией.

---

# EPIC 6. Категории и каталог

## KM-0601 [P1] Category route

`/catalog/{category-slug}/`

Initial/server HTML содержит:
- H1;
- intro;
- product links;
- min prices;
- breadcrumbs;
- metadata;
- canonical.

## KM-0602 [P1] ProductCard

Показывает:
- фото;
- модель;
- short descriptor optional;
- `от N ₽` из min active variant price;
- optional material hint;
- crawlable product link.

## KM-0603 [P1] Filters

MVP:
- материал;
- цвет/оттенок;
- размер;
- цена.

URL state допускается для UX, но generic filter combinations не индексируются и не включаются в sitemap.

## KM-0604 [P1] Empty/filter states

Нельзя генерировать тысячи crawlable пустых страниц. Пользователь получает понятный empty state и reset filters.

## KM-0605 [P2] Curated SEO landings

Создавать только после семантики и достаточного ассортимента, например отдельные landing combinations. Каждая — самостоятельный route/content/canonical, а не auto-indexed filter URL.

---

# EPIC 7. PDP и конфигуратор

## KM-0701 [P1] Product detail route

`/catalog/{category}/{product}/`

Server HTML:
- H1;
- default/preselected active variant;
- min/exact price;
- description;
- main image;
- breadcrumbs;
- JSON-LD.

## KM-0702 [P1] Variant resolver

Алгоритм:
1. пользователь выбирает option;
2. UI отключает несовместимые значения;
3. при полной комбинации находится ровно один active variant;
4. сервер подтверждает variant при cart mutation;
5. URL query может отражать выбор;
6. canonical остается base product URL.

## KM-0703 [P1] Price behavior

- до полной конфигурации допустимо `от N ₽`;
- после выбора — точная цена;
- client price не является источником истины;
- min price считается из active variants;
- изменение варианта обновляет analytics payload.

## KM-0704 [P1] Gallery

- product-level images;
- variant-aware images;
- zoom;
- keyboard;
- swipe;
- responsive sources;
- no layout shift.

## KM-0705 [P1] Sticky purchase panel desktop

Содержит selectors, price, availability/lead-time copy, add-to-cart, custom order path.

## KM-0706 [P1] Mobile purchase bar

Не перекрывает поля, cookie banner, keyboard и dialogs.

## KM-0707 [P1] Custom order escape hatch

`Нужен другой размер / материал?` ведет не в фиктивный variant, а в `custom_order_request` с product context.

---

# EPIC 8. Cart

## KM-0801 [P1] Cart line schema

Строка хранит:
- productId;
- variantId;
- selected option display data;
- current display image;
- quantity.

Цена на сервере перечитывается.

## KM-0802 [P1] Cart reconciliation

При открытии/checkout:
- variant exists;
- active;
- price current;
- config consistent;
- quantity valid.

Изменения показываются до оплаты.

## KM-0803 [P1] Persistent cart

Guest cart должен переживать навигацию, но localStorage/cookie не является источником цены.

---

# EPIC 9. Checkout

## KM-0901 [P1] Guest checkout first

Регистрация не обязательна для покупки. Аккаунт можно предложить после заказа.

## KM-0902 [P1] Customer/recipient fields

Собирать только реально необходимые данные. Отдельно определить buyer vs recipient при необходимости.

## KM-0903 [P1] Delivery model

MVP должен поддержать утвержденные сценарии:
- Уфа;
- Россия с индивидуальным расчетом/ТК;
- optional pickup только если бизнес его реально предоставляет.

Нельзя обещать автоматическую стоимость, если ее нельзя корректно рассчитать.

## KM-0904 [P0/P1] Consents

Отдельное согласие на обработку ПДн. Не объединять в одну галочку с офертой/рассылкой.

Marketing consent — отдельный и необязательный.

## KM-0905 [P1] Order review

Перед созданием payment пользователь видит:
- модель;
- конфигурацию;
- количество;
- цену;
- delivery terms;
- total;
- ссылки на применимые документы.

## KM-0906 [P1] Confirmation

После успешного создания заказа показать/отправить:
- номер заказа;
- состав;
- статус оплаты;
- дальнейшие шаги;
- контакты.

---

# EPIC 10. Payments и фискализация

## KM-1001 [P0] Утвердить PaymentPolicy

До production бизнес должен выбрать:
- full prepayment;
- partial prepayment;
- payment after manager confirmation;
- смешанный режим.

Режим должен быть настройкой, а не buried constant.

## KM-1002 [P1] Server-side payment amount

Payment создается только по total из БД/order snapshot, никогда из client payload.

## KM-1003 [P1] Idempotency

- уникальный payment attempt/idempotency key;
- повторный webhook не создает дубль состояния;
- payment amount/order mismatch -> alert + controlled failure.

## KM-1004 [P0] 54-ФЗ receipt flow

Совместно с бухгалтером утвердить:
- систему налогообложения;
- НДС/без НДС;
- предмет расчета;
- способ расчета;
- чек предоплаты;
- финальный чек/зачет при необходимости;
- возвраты.

Затем реализовать выбранный способ через ЮKassa/ККТ.

## KM-1005 [P1] Refund admin flow

Возврат не делается ручным редактированием `status=refunded`. Нужны payment provider action, audit trail и синхронизация order/payment/receipt status.

---

# EPIC 11. Orders и производство

## KM-1101 [P1] Order snapshot

После оформления заказ хранит неизменяемое представление:
- product display name;
- SKU;
- option labels;
- unit price;
- quantity;
- tax fields;
- delivery selection;
- lead time statement/version.

Переименование каталога не меняет старый заказ.

## KM-1102 [P1] Production lifecycle

Поддержать бизнес-статусы минимум:
- confirmed;
- production_queue;
- in_production;
- quality_control;
- ready_for_shipment;
- shipped;
- delivered;
- completed;
- cancelled/refunded.

Можно сохранить legacy order state и добавить production substate на этапе миграции.

## KM-1103 [P1] Order events

Каждый значимый переход:
- кто;
- когда;
- from/to;
- comment;
- source;
- related external id optional.

## KM-1104 [P1] Customer communication

Триггеры минимум:
- order created;
- payment success/failure if useful;
- production milestone where approved;
- ready/shipped;
- cancellation/refund.

---

# EPIC 12. Индивидуальные заказы

## KM-1201 [P1] Custom order form

Поля согласно утвержденному business minimum; поддержать product context.

## KM-1202 [P1] Private file uploads

- MIME allowlist;
- size limits;
- sanitized filename/key;
- private bucket/prefix;
- signed access;
- admin authorization;
- retention policy.

## KM-1203 [P1] Custom lead pipeline

`new -> contacted -> estimating -> proposal_sent -> approved -> converted_to_order / rejected / closed`.

## KM-1204 [P2] Convert to order

Admin может создать negotiated custom line item/order snapshot без загрязнения standard catalog фиктивным SKU.

---

# EPIC 13. Для дизайнеров

## KM-1301 [P1] Designer landing

Контент:
- что производим;
- как работаем с проектами;
- материалы;
- этапы;
- кейсы;
- CTA.

Не публиковать систему вознаграждения, пока она не утверждена.

## KM-1302 [P1] Designer project submission

Отдельная сущность и форма с project context/files.

## KM-1303 [P2] Designer account/cabinet

Только после реальной потребности. Не блокирует MVP.

---

# EPIC 14. CMS и информационные страницы

## KM-1401 [P1] Page SEO fields

Для каждой индексируемой CMS page:
- meta title;
- description;
- OG;
- canonical override restricted;
- index toggle restricted;
- excerpt;
- updatedAt;
- content blocks;
- related products/categories.

## KM-1402 [P1] Service pages

Минимум:
- материалы и отделка;
- о бренде;
- как мы работаем;
- доставка и оплата;
- гарантия;
- контакты;
- для дизайнеров.

## KM-1403 [P1] Blog

- index;
- article;
- author/reviewer optional;
- related products/categories;
- dateModified;
- editorial CTA;
- internal links.

---

# EPIC 15. SEO technical

## KM-1501 [P0/P1] Metadata

Unique title/description/canonical/robots/OG for all indexable templates.

## KM-1502 [P1] robots.txt

Запретить crawl технических/private пространств там, где это уместно. Не использовать robots.txt как механизм удаления уже индексированной страницы.

## KM-1503 [P1] Sitemap

Включать только canonical/indexable/published URLs. `lastmod` = meaningful update.

## KM-1504 [P1] Breadcrumbs

Видимые + `BreadcrumbList`.

## KM-1505 [P1] Product structured data

Использовать совместимую модель:
- ProductGroup;
- Product variants;
- Offer;
- variesBy;
- hasVariant;
- productGroupID;
- availability;
- priceCurrency;
- images.

Yandex-specific output не должен противоречить Google-visible data.

## KM-1506 [P1] Variant URL semantics

Каждый выбираемый variant может иметь shareable query state. Canonical — base PDP для single-page implementation.

## KM-1507 [P1] Faceted navigation control

- generic filter URLs не sitemap;
- не превращать комбинации в crawl graph;
- sorting noindex/non-canonical;
- curated SEO landings отдельными routes.

## KM-1508 [P1] Redirect map

При смене legacy URLs составить explicit 301 map. Не редиректить все удаленное на главную.

---

# EPIC 16. Feeds

## KM-1601 [P1] YML

Feed берет данные из той же БД/price service, что PDP/checkout.

Проверять:
- URL;
- name;
- price;
- currency;
- availability;
- category;
- picture;
- vendor/brand где корректно;
- description без конфликтующих условий.

## KM-1602 [P2] Google Merchant Center

Подключать после стабилизации catalog policy, delivery/returns и product data.

---

# EPIC 17. Analytics

## KM-1701 [P1] Яндекс Метрика

- counter;
- Webvisor;
- ecommerce data layer/events;
- lead goals;
- checkout funnel.

## KM-1702 [P1] Ecommerce event dictionary

Минимум:
- view_item_list;
- select_item;
- view_item;
- select_item_variant custom optional;
- add_to_cart;
- remove_from_cart;
- view_cart;
- begin_checkout;
- add_shipping_info;
- add_payment_info;
- purchase;
- generate_lead;
- submit_designer_project.

## KM-1703 [P0/P1] PII guard

Не отправлять ФИО, email, телефон, полный адрес в analytics/error monitoring.

---

# EPIC 18. Performance

## KM-1801 [P1] Image pipeline

- responsive sizes;
- AVIF/WebP;
- correct width/height;
- priority только для LCP;
- lazy loading below fold;
- не загружать всю gallery upfront;
- S3/CDN strategy.

## KM-1802 [P1] JS budget

Server Components by default. Client только для реальной интерактивности.

## KM-1803 [P1] Core Web Vitals gate

Цель field p75:
- LCP <= 2.5 s;
- INP <= 200 ms;
- CLS <= 0.1.

## KM-1804 [P1] Cache invalidation

Изменение product/variant/price/media должно корректно инвалидировать storefront, sitemap/feed where relevant.

---

# EPIC 19. Accessibility

## KM-1901 [P1] Keyboard and focus

Все интерактивные элементы доступны клавиатурой, focus visible.

## KM-1902 [P1] Selectors

Материал/цвет нельзя кодировать только цветом; есть текст/accessible name/selected state.

## KM-1903 [P1] Dialogs and drawers

- focus trap;
- Escape;
- return focus;
- aria naming;
- scroll locking.

## KM-1904 [P1] Forms

- labels;
- inline error;
- error summary where useful;
- accessible required state;
- server errors preserved.

---

# EPIC 20. Security

## KM-2001 [P0/P1] Auth/admin hardening

- rate limit;
- secure session cookies;
- brute-force mitigation;
- admin authorization server-side;
- optional 2FA post-MVP or earlier if supported.

## KM-2002 [P1] Mutation protection

Проверить CSRF/origin assumptions для всех mutating endpoints/actions.

## KM-2003 [P1] Upload security

MIME sniffing, extension policy, size, private storage, authorization.

## KM-2004 [P1] Dependency/security scanning

CI check + process обновлений.

## KM-2005 [P1] Secrets

- no secrets in repo;
- staging/prod separated;
- rotation documented.

---

# EPIC 21. Legal/content readiness

## KM-2101 [P0] Зафиксировать продавца

Подтвердить:
- полное наименование ИП/ООО;
- ИНН/ОГРН(ИП);
- адрес;
- email;
- телефон;
- tax/VAT status;
- банковские/публичные реквизиты где требуется.

## KM-2102 [P0] Утвердить оферту и purchase terms

Отдельный юридический документ, проверенный под фактическую модель made-to-order продаж.

## KM-2103 [P0] Политика ПДн и отдельное согласие

Тексты не генерировать автоматически как окончательные юридические документы без проверки специалистом.

## KM-2104 [P0] Условия доставки/возврата/гарантии

Не публиковать предполагаемые условия как факт.

## KM-2105 [P1] Product data completeness

Для каждой launch model:
- название;
- slug;
- категория;
- photos;
- sizes;
- materials;
- colors;
- finishes;
- allowed variants;
- exact variant prices;
- lead time;
- construction;
- care;
- delivery notes;
- SEO title/description;
- alt.

---

# EPIC 22. QA и release gates

## KM-2201 [P1] Unit tests

Покрыть:
- money;
- min price;
- variant resolution;
- availability;
- order transitions;
- receipt mapping;
- sitemap/YML serialization.

## KM-2202 [P1] Integration tests

Покрыть:
- valid/invalid variant add-to-cart;
- repricing;
- order transaction;
- duplicate webhook;
- amount mismatch;
- admin variant update/cache invalidation;
- custom upload validation.

## KM-2203 [P1] E2E

Критическая цепочка:
`catalog -> PDP -> variant -> cart -> checkout -> test payment -> order confirmation -> account/admin`.

Отдельно:
- custom order;
- designers form;
- mobile navigation;
- consent behavior.

## KM-2204 [P1] SEO smoke

Автоматически/ручным чеклистом проверить:
- status;
- canonical;
- robots;
- H1;
- metadata;
- JSON-LD parse;
- sitemap membership;
- internal link;
- noindex private pages.

## KM-2205 [P1] Device/browser matrix

Минимум:
- current Chrome desktop;
- Safari macOS/iOS;
- Chrome Android;
- Firefox desktop;
- Edge desktop.

## KM-2206 [P0] Payment/receipt live test

До публичного запуска выполнить реальный контролируемый платеж и проверить payment + receipt + order + email + refund flow в утвержденной схеме.

---

# EPIC 23. Launch

## KM-2301 [P0] Production checklist

- env validated;
- migrations backup + dry run;
- DB backup;
- DNS/TLS;
- CSP/security headers;
- S3/CORS;
- email domain SPF/DKIM/DMARC;
- payment production credentials;
- receipt production credentials;
- analytics IDs;
- legal pages published;
- robots/sitemap production mode;
- monitoring alerts.

## KM-2302 [P1] Soft launch

Первые дни:
- ограниченный трафик;
- log/error watch;
- orders manual verification;
- YML validation;
- Search Console/Webmaster inspection;
- CWV/RUM collection.

## KM-2303 [P1] Indexing

После проверки:
- robots production;
- sitemap submit;
- key URL inspect;
- Yandex Webmaster;
- Google Search Console;
- monitoring coverage/index changes.

---

# EPIC 24. Post-MVP backlog

Не блокируют первый запуск:
- wishlist;
- reviews;
- promo codes;
- gift cards;
- ready-stock inventory;
- automatic carrier quotes;
- advanced onsite search;
- recommendations/personalization;
- saved configurations;
- designer cabinet;
- downloadable 3D/Revit assets;
- AR/3D configurator;
- CRM integration;
- ERP/1C integration;
- multi-admin RBAC;
- automated merchandising.

---

# Recommended execution order

`EPIC 0 -> 1 -> 2 -> 3 -> 4 -> 6/7 -> 8/9 -> 10/11 -> 12/13 -> 14/15/16/17 -> 18/19/20 -> 21 -> 22 -> 23`

Главный принцип: сначала стабилизировать фундамент и товарную модель, затем строить интерфейс вокруг корректного домена. Нельзя сначала «нарисовать новый магазин», а потом пытаться подогнать под него данные, pricing и checkout.

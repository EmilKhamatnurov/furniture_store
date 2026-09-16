# KHAMATNUROV MEBEL — Техническая архитектура и модель данных

Версия 1.0 • 17 сентября 2026

## 1. Цель документа

Этот документ переводит бизнес-модель KHAMATNUROV MEBEL в техническую архитектуру. Он является рабочим ТЗ для backend/full-stack разработчика и AI coding agent. Основной принцип: развивать текущий `furniture_store` как модульный монолит, а не строить вторую платформу рядом и не переносить проект на CMS.

Исходные допущения о текущем проекте взяты из изученных `SPEC.md`, `package.json` и сопутствующей документации репозитория: Next.js 15.5.x, React 19, TypeScript, PostgreSQL + Drizzle ORM, Redis, BullMQ, отдельный worker, каталог/варианты, корзина, checkout, заказы, ЮKassa, личный кабинет, admin, CMS и email-очереди. Перед реализацией каждый пункт сверяется с фактическим кодом и миграциями.

---

## 2. Архитектурные принципы

### 2.1. Модульный монолит

Сохраняется один deployable application + worker, одна основная PostgreSQL и Redis. Домены отделяются в коде и по API, но не дробятся на микросервисы без реальной причины.

Рекомендуемые домены:

```text
src/modules/
  catalog/
  pricing/
  cart/
  checkout/
  orders/
  payments/
  shipping/
  customers/
  auth/
  admin/
  cms/
  email/
  custom-orders/
  designer-projects/
  settings/
  feeds/
  analytics/
```

Границы:

- `catalog` владеет моделями, категориями, опциями, вариантами и медиа;
- `pricing` возвращает авторитетную цену конкретной конфигурации;
- `cart` хранит выбранный `variantId`, количество и пользовательский контекст, но не является источником цены;
- `checkout` валидирует корзину и собирает данные заказа;
- `orders` создает неизменяемый снимок покупки;
- `payments` знает платежного провайдера, но не изменяет состав заказа;
- `shipping` определяет доступные сценарии доставки и стоимость, когда она автоматизирована;
- `settings` хранит изменяемые бизнес-условия;
- `feeds` формирует YML/другие товарные выгрузки из той же модели каталога;
- `custom-orders` и `designer-projects` не создают фиктивный стандартный SKU до согласования.

### 2.2. Server-authoritative business logic

Клиентский код может показывать предварительный расчет, но сервер всегда повторно проверяет:

- существование и активность товара;
- существование варианта;
- допустимость комбинации;
- актуальную цену;
- доступность для заказа;
- правила доставки;
- итоговую сумму;
- условия платежа.

Никогда не принимать `price`, `discount`, `deliveryPrice` или произвольный набор опций как доверенные числа от браузера.

### 2.3. Snapshot на границе заказа

После создания заказа он должен оставаться корректным даже если завтра переименовать товар, изменить цену, оттенок или удалить вариант из каталога.

Поэтому `order_items` сохраняет как минимум:

- `productId` и `variantId` для связи;
- snapshot названия модели;
- SKU;
- выбранный размер;
- материал;
- оттенок;
- отделку;
- иные выбранные характеристики;
- unit price;
- quantity;
- line total;
- валюту;
- превью изображения;
- срок производства/формулировку, показанную при покупке, если это юридически/операционно важно.

---

## 3. Целевая товарная модель

### 3.1. Product

`Product` = дизайнерская модель мебели, а не каждая комбинация параметров.

Поля уровня модели:

```text
id
slug
name
modelCode / parentSku
categoryId
collectionId?          # если появятся коллекции
shortDescription
fullDescription
status                 # draft/active/archived
orderMode              # standard/custom/both
madeToOrder            # bool
seoTitle
seoDescription
seoH1
canonicalOverride?
indexPolicy
publishedAt
createdAt
updatedAt
```

Также модель содержит общие характеристики, которые не меняются между вариантами: стиль, назначение, базовая конструкция, важные особенности, допустимая нагрузка — только если подтверждена производством.

### 3.2. Category

Категория является одновременно UX-разделом и потенциальной SEO-посадочной.

```text
id
parentId?
slug
name
h1
introText
seoTitle
seoDescription
indexPolicy
sortOrder
isVisible
imageId?
```

Не создавать подкатегорию только потому, что она возможна в модели данных. Для индексируемой категории нужны реальный ассортимент, поисковый спрос и полезный контент.

### 3.3. OptionDefinition

Справочник типов выбора:

```text
size
material
color
finish
base
hardware
```

Поля:

```text
id
code
name
uiType             # pills/swatches/cards/select
unit?
sortOrder
isFilterable
isVariantAxis
```

### 3.4. OptionValue

Значения справочника:

```text
id
optionDefinitionId
code
name
shortName?
hexColor?
textureMediaId?
metadata jsonb
sortOrder
isActive
```

Пример:

- `material: oak_veneer` → «Дубовый шпон»;
- `finish: osmo_clear` → «Масло Osmo, натуральное»;
- `size: 1800x900` → metadata `{widthMm: 1800, depthMm: 900, heightMm: 750}`.

Для размеров предпочтительно хранить числовые измерения отдельно, а не только строку, чтобы фильтры и будущий расчет логистики работали корректно.

### 3.5. ProductOptionValue

Связь определяет, какие значения вообще разрешены у конкретной модели.

```text
productId
optionValueId
isDefault
sortOrder
```

Она нужна, чтобы одна глобальная палитра материалов не показывалась у каждого товара целиком.

### 3.6. ProductVariant

`ProductVariant` = конкретная продаваемая стандартная комбинация.

```text
id
productId
sku
status                  # active/hidden/archived
priceAmount             # integer minor units или numeric по принятому стандарту
compareAtPriceAmount?
currency                 # RUB
availabilityPolicy      # made_to_order/in_stock/unavailable
stockQty?               # post-MVP
leadTimeRuleId?
weightGrams?
packageMetadata jsonb?
createdAt
updatedAt
```

Не хранить деньги во float/double.

### 3.7. VariantOptionValue

Нормализованная матрица:

```text
variantId
optionDefinitionId
optionValueId
```

Ограничения:

- один `optionDefinition` не может повторяться дважды внутри одного варианта;
- комбинация значений внутри одного `Product` должна быть уникальной;
- вариант обязан содержать значения всех обязательных variant axes товара.

### 3.8. Почему на MVP цена хранится у варианта

Для небольшой авторской коллекции вариантный прайс надежнее универсальной формулы:

- невозможно продать несуществующее сочетание;
- цена детерминирована;
- проще QA;
- проще YML и Schema.org;
- проще возвраты/история заказа;
- изменение себестоимости не ломает старые заказы.

Формульный pricing engine можно вводить позже, если число комбинаций станет слишком большим. Даже тогда финальная цена перед заказом должна материализоваться и снапшотиться.

---

## 4. Конфигуратор товара

### 4.1. Алгоритм

На загрузке карточки сервер получает:

1. Product;
2. доступные option values;
3. матрицу активных variants;
4. изображения и привязки к опциям;
5. минимальную цену;
6. default variant/default selection.

На клиенте конфигуратор не генерирует комбинации сам. Он вычисляет доступные следующие значения только на основании реальной variant matrix.

Пример:

```text
Выбран размер 1800x900
→ остаются только варианты с size=1800x900
→ UI отключает материалы, которых среди них нет

Выбран oak_veneer
→ остаются варианты size=1800x900 + material=oak_veneer
→ UI отключает недоступные отделки

После выбора всех обязательных осей
→ найден ровно один active variant
→ показывается его SKU/цена/lead time
```

### 4.2. URL выбранного варианта

Карточка имеет базовый индексируемый URL:

```text
/catalog/stoly/model-khm-01/
```

Для расшаривания/предвыбора допускается:

```text
/catalog/stoly/model-khm-01/?size=1800x900&material=oak-veneer&finish=osmo-natural
```

Требования:

- сервер должен уметь прочитать query и вернуть страницу с правильным предвыбором;
- базовый URL остается canonical;
- URL конкретного варианта присутствует в Product structured data;
- некорректный query не должен приводить к 500; UI сбрасывает к ближайшему допустимому состоянию или показывает, что вариант недоступен.

### 4.3. Медиа-конфигуратор

`ProductMedia`:

```text
id
productId
storageKey
alt
width
height
sortOrder
role                # gallery/hero/detail/dimension/material
```

`MediaBinding` позволяет привязать фотографию к конкретному variant или option value. Пример: при выборе темного оттенка основная фотография может меняться на соответствующую съемку, если она реально существует.

Не имитировать цвет мебели CSS-фильтрами как доказательство реального оттенка.

---

## 5. Корзина

### 5.1. Что хранить

В корзине достаточно:

```text
cartId
variantId
quantity
addedAt
```

Допустимо хранить display snapshot в client state для скорости, но при открытии корзины и особенно checkout данные повторно гидратируются с сервера.

### 5.2. Repricing

Перед checkout:

- получить все варианты из БД;
- убедиться, что они active/orderable;
- получить актуальные цены;
- сравнить с отображенными ранее;
- если цена изменилась — явно сообщить пользователю и потребовать продолжить с новой суммой;
- сформировать server-side totals.

### 5.3. Корзина гостя

Рекомендуется поддерживать гостевой сценарий как основной. После авторизации гостевая корзина должна merge-иться с пользовательской без дублирования одного и того же variant.

---

## 6. Заказы и производственный lifecycle

### 6.1. Разделять payment status и fulfillment/production status

Не использовать один enum `status` для всего.

Минимально:

```text
orderStatus:
  draft
  placed
  confirmed
  cancelled
  completed

paymentStatus:
  not_required
  pending
  partially_paid
  paid
  partially_refunded
  refunded
  failed

productionStatus:
  awaiting_confirmation
  queued
  materials_preparation
  in_production
  quality_control
  packed
  ready_for_dispatch
  not_applicable

shippingStatus:
  pending
  arranging
  handed_to_carrier
  in_transit
  delivered
  cancelled
```

UI клиента может показывать укрупненные понятные стадии, а админка — подробные.

### 6.2. История событий

Каждое изменение критичных статусов писать в `order_events`:

```text
id
orderId
eventType
fromValue?
toValue?
actorType          # system/admin/customer/provider
actorId?
metadata jsonb
createdAt
```

Платежные webhook нельзя «затирать» простой заменой поля — исходное событие/идентификатор провайдера и результат обработки должны логироваться идемпотентно.

---

## 7. Custom Orders и Designer Projects

### 7.1. CustomOrderRequest

```text
id
sourceProductId?
sourceVariantId?
customerId?
name
phone
email?
city?
requestType
message
status
assignedAdminId?
createdAt
updatedAt
```

Отдельная таблица файлов:

```text
custom_order_files
  id
  requestId
  storageKey
  originalName
  mimeType
  sizeBytes
  createdAt
```

### 7.2. DesignerProject

Для B2B лучше отдельная сущность, потому что позже появятся партнерский статус, несколько помещений, сметы и повторные проекты.

MVP-поля:

```text
id
contactName
studioName?
phone
email
city?
projectName?
approxBudget?
desiredDate?
description
status
createdAt
updatedAt
```

Файлы загружаются приватно. Не хранить проектные файлы в публичном бакете без авторизации.

---

## 8. Settings вместо hardcode

Создать типизированный слой настроек, а не универсальную бесконтрольную key-value помойку.

Группы:

### CommerceSettings

- currency;
- payment mode;
- default lead-time display;
- custom-size rule text;
- order confirmation behavior;
- minimum order if появится.

### ContactSettings

- phone;
- email;
- Telegram;
- MAX;
- WhatsApp только если бизнес решит использовать канал;
- production address/showroom address отдельно.

### DeliverySettings

- delivery explanation;
- installation in Ufa;
- nationwide shipping policy;
- pickup policy;
- automation feature flags.

### SEO/SocialSettings

- default title template;
- default OG image;
- organization data;
- social profiles.

Изменение настроек — через admin с audit trail для критичных commerce-полей.

---

## 9. CMS и контент

Существующую CMS сохранить. Расширить сущности страниц полями:

```text
slug
pageType
status
h1
title
description
ogTitle?
ogDescription?
ogImage?
robotsIndex
robotsFollow
canonicalOverride?
contentBlocks/json or structured body
publishedAt
updatedAt
```

Для core-страниц (`delivery`, `warranty`, `about`) можно иметь фиксированные routes, но тексты и SEO должны редактироваться из admin.

---

## 10. Search и фильтрация

При небольшом каталоге PostgreSQL достаточно.

Реализовать:

- filter by category;
- material;
- color/finish;
- size ranges/предопределенные размеры;
- price range;
- future availability;
- sort: recommended/new/price asc/price desc.

Не подключать Elasticsearch/Meilisearch в MVP только ради модности. Рассматривать отдельный search engine при сотнях/тысячах моделей, сложном полнотекстовом поиске и подтвержденных bottleneck.

---

## 11. Cache

### 11.1. Что кешировать

- category tree;
- product list DTO;
- product detail DTO;
- content pages;
- settings read model;
- feed generation fragments при необходимости.

### 11.2. Инвалидация

При публикации/изменении product/category/variant:

- инвалидировать ключ продукта;
- категории, куда он входит;
- related product widgets;
- минимальную цену;
- sitemap/feed cache при необходимости.

Не задавать «длинный TTL и надеяться». Для цены и orderability нужен предсказуемый invalidation path.

### 11.3. Checkout не зависит от кеша как источника истины

Даже если storefront показывает cached DTO, заказ повторно читает авторитетные данные из БД в транзакции.

---

## 12. Транзакции и конкурентность

При создании заказа:

1. начать DB transaction;
2. перечитать variants/prices;
3. проверить status;
4. рассчитать subtotal/delivery/total;
5. создать order;
6. создать order_items snapshots;
7. зафиксировать transaction;
8. после commit инициировать платеж/очередь уведомления.

Не держать открытую DB transaction во время HTTP-запроса к ЮKassa.

Для idempotency order creation использовать client request id / idempotency key, чтобы двойной click не создавал два заказа.

---

## 13. Payment architecture

`Payment` хранит:

```text
id
orderId
provider
providerPaymentId
idempotencyKey
amount
currency
status
confirmationUrl?
paidAt?
metadata jsonb
createdAt
updatedAt
```

`PaymentEvent`/webhook log:

```text
providerEventId unique
paymentId?
payloadHash
receivedAt
processedAt?
processingResult
```

Правила:

- webhook signature/authentication — строго по документации провайдера;
- повторный webhook безопасен;
- фронтенд redirect «успешно» не является доказательством оплаты;
- статус оплаты определяется backend/provider webhook + при необходимости server-side query.

---

## 14. Фискализация

ЮKassa прямо указывает, что для соблюдения 54-ФЗ продавцу необходимо настроить отправку чеков: через «Чеки от ЮKassa» либо внешнюю онлайн-кассу. Поэтому архитектура оплаты не считается production-ready, пока не выбран и не протестирован конкретный способ фискализации.

В модели заказа/платежа предусмотреть:

- `receiptStatus`;
- связь receipt ↔ payment/refund;
- данные позиций для чека;
- tax/vat code, если применимо к продавцу;
- payment subject/method по выбранной схеме учета;
- повторные фискальные события при частичной оплате/возврате, если требуются выбранной схемой.

Конкретные коды определяются бухгалтером и актуальной документацией, а не разработчиком «по аналогии».

---

## 15. Файлы и S3-compatible storage

Публичные:

- product images;
- category images;
- blog/media;
- OG images.

Приватные:

- файлы дизайнерских проектов;
- потенциально документы клиентов;
- любые вложения с персональными данными.

Требования:

- randomized storage keys;
- original filename хранить metadata;
- whitelist MIME и расширений;
- лимит размера;
- image re-encoding при публичных изображениях;
- signed URLs для private;
- lifecycle/backup policy;
- удаление orphan files отдельной безопасной job.

---

## 16. Безопасность

### P0

1. Next.js 15.5.x обновить минимум до 15.5.24 согласно security release 25.08.2026 или перейти на актуальную поддерживаемую ветку отдельным релизом.
2. Проверить все зависимости `npm audit`/SCA и changelog критичных runtime packages.
3. Rotate secrets, если dev/prod ключи когда-либо попадали в репозиторий/лог.

### Application security

- secure/httpOnly/sameSite cookies;
- CSRF-защита там, где архитектура с cookie auth требует ее;
- rate limiting login/password reset/contact/file upload/checkout;
- Zod/typed validation server-side;
- RBAC/admin authorization на каждом endpoint, а не только скрытие UI;
- CSP;
- input sanitization для CMS rich text;
- no secrets/client tokens in browser;
- PII masking logs;
- admin audit log;
- signed upload flow.

### Admin authentication

Если сейчас существует один env-admin, для MVP допустимо временно сохранить только при наличии сильного password hash/secure sessions/rate-limit и ограниченного круга пользователей. Для реальной операционной работы рекомендуется таблица `admin_users`, роли и возможность отзыва сессий.

Минимальные роли в перспективе:

- owner;
- manager;
- content;
- production;
- seo.

Не нужно строить сложный ABAC до появления команды, но архитектура не должна предполагать одного вечного администратора.

---

## 17. Observability

Нужны три уровня:

### Logs

Структурированные, с `requestId`, `orderId`, `paymentId`, без открытых телефонов/email.

### Errors

Production error monitoring с release/version и source maps. Выбор сервиса отдельный; при передаче ПДн в сторонние сервисы учитывать правовой контур.

### Business metrics

- checkout started;
- order created;
- payment initiated;
- payment succeeded/failed;
- webhook errors;
- email job failures;
- custom-order submitted.

Технический мониторинг должен отличать «сервер жив» от «заказы проходят».

---

## 18. Backup и disaster recovery

Production-ready критерии:

- автоматический DB backup;
- backup хранится отдельно от основного VPS;
- шифрование/доступ ограничен;
- retention policy;
- документированный restore procedure;
- минимум один тест восстановления на staging до запуска;
- резервирование приватных файлов согласно их критичности;
- RPO/RTO зафиксированы хотя бы операционно.

`pg_dump` в инструкции без проверенного restore не считается системой резервного копирования.

---

## 19. CI/CD

Pull request pipeline:

```text
install locked deps
→ typecheck
→ lint
→ unit tests
→ integration tests critical domains
→ build
```

Staging deploy:

- отдельная БД;
- test ЮKassa;
- отдельные email credentials;
- `noindex` + access protection;
- production-like reverse proxy/HTTPS.

Production deployment:

- migrations выполняются контролируемо до переключения приложения;
- backwards-compatible migrations для критичных таблиц;
- healthcheck;
- rollback artifact/previous image;
- smoke checkout after deploy.

---

## 20. Миграция существующей модели товара

Не делать destructive migration «сразу заменили таблицы».

### Phase A — Inventory

- снять ERD фактической БД;
- выгрузить поля `products`, `product_variants`, `order_items`;
- определить, какие variant attributes уже есть;
- зафиксировать test fixtures текущего checkout.

### Phase B — Additive schema

Добавить новые таблицы/колонки без удаления старых.

### Phase C — Adapter

Новый catalog service умеет читать новую матрицу, а существующие тестовые товары либо мигрируются скриптом, либо обслуживаются compatibility layer.

### Phase D — Admin migration

Сначала обеспечить создание/редактирование новой товарной модели в admin.

### Phase E — Storefront

Переключить карточку на новый DTO/конфигуратор.

### Phase F — Cart/Checkout

Передавать только new `variantId`; добавить snapshot выбранных опций.

### Phase G — Cleanup

Удалять legacy-поля только после полного production cycle и backup.

---

## 21. API / server actions contracts

Не привязывать UI напрямую к Drizzle row types. Ввести DTO.

Пример `ProductDetailDTO`:

```ts
{
  id,
  slug,
  name,
  parentSku,
  description,
  category,
  media,
  options: [
    { code: 'size', values: [...] },
    { code: 'material', values: [...] },
    { code: 'color', values: [...] },
    { code: 'finish', values: [...] }
  ],
  variants: [
    {
      id,
      sku,
      selections: { size, material, color, finish },
      price,
      availability,
      mediaIds
    }
  ],
  minPrice,
  defaultSelection,
  seo
}
```

`CreateOrderInput` не содержит доверенную цену:

```text
cartToken / items[{variantId, qty}]
contact
shipping selection
required agreements versions
idempotencyKey
```

---

## 22. Definition of Done архитектурного этапа

Этап считается завершенным, когда:

- новая схема БД применима на чистую БД и на копию существующей;
- один Product поддерживает минимум 4 axes без дублирования карточек;
- невозможно создать два одинаковых варианта внутри модели;
- конфигуратор никогда не предлагает невозможную комбинацию;
- цена на UI и цена server checkout вычисляются из одного источника;
- order_item хранит snapshot всех выбранных значений;
- изменение каталога не изменяет историю старого заказа;
- query URL предвыбирает вариант;
- базовая карточка остается canonical;
- cache invalidation покрыт тестами;
- webhook idempotency покрыта интеграционным тестом;
- backup/restore проверен на staging;
- security patch Next.js выполнен до product migration.


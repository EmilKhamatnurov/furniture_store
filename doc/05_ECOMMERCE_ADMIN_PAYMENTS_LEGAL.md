# KHAMATNUROV MEBEL — Ecommerce, админка, платежи и юридически значимая логика

Версия 1.0 • 17 сентября 2026

> Документ задает технические требования. Он не заменяет юридическое заключение или бухгалтерскую настройку. Финальные тексты оферты, возвратов, гарантии, фискальные параметры и основания обработки ПДн согласовываются профильными специалистами до production.

## 1. Коммерческая модель

Есть два разных продукта процесса:

1. **Стандартная коллекция** — фиксированные допустимые варианты, точная цена, online order.
2. **Индивидуальный заказ** — нестандартный размер/материал/конструкция/проект; заявка и расчет до возникновения финальной цены.

Эти пути нельзя смешивать.

---

## 2. Standard checkout flow

```text
Product variant selected
→ Add to cart
→ Server cart validation/repricing
→ Contact + delivery data
→ Agreements
→ Create Order with snapshot
→ Create payment if payment required at this point
→ Payment provider
→ Webhook confirms payment
→ Customer confirmation
→ Manager confirmation/production
```

Момент создания заказа и момент платежа должны быть разделены технически, даже если UX идет подряд.

---

## 3. Checkout без обязательной регистрации

Для high-ticket мебели обязательная регистрация до покупки увеличивает friction и не дает необходимой бизнес-ценности.

Рекомендация:

- guest checkout по умолчанию;
- после заказа можно предложить активировать кабинет;
- если email/телефон совпал с аккаунтом — безопасный link/login flow, без раскрытия наличия аккаунта злоумышленнику;
- order access в кабинете только после подтвержденной аутентификации.

---

## 4. Поля checkout

Минимально, после определения доставки:

### Contact

- имя;
- телефон;
- email — рекомендуется для подтверждений/чека, обязательность зависит от процесса;

### Delivery

- город;
- адрес/детали только если доставка требует;
- получатель, если отличается;
- comment.

### Order

- selected shipping option;
- selected payment option;
- agreement records.

Не собирать «на всякий случай» дату рождения, паспорт и прочие данные без необходимости.

---

## 5. Подтверждение заказа

Новые Правила продажи товаров по договору розничной купли-продажи, утвержденные Постановлением Правительства РФ №657 от 30.05.2026, действуют с 1 сентября 2026 (с учетом актуальной редакции). Для дистанционной продажи техническая реализация должна обеспечивать доступ к условиям оферты и надлежащее подтверждение оформленного заказа.

Практическое ТЗ:

- перед оформлением пользователь имеет доступ к публичной оферте/условиям продажи;
- после заказа сервер формирует стабильный `orderNumber`;
- success screen показывает номер;
- email/SMS/иной утвержденный канал содержит номер и существенные данные заказа;
- сохраняется версия условий/документов, с которыми связан заказ, чтобы можно было доказать, какие условия действовали на момент оформления;
- нельзя полагаться только на ephemeral browser screen.

Финальную юридическую трактовку конкретных пунктов правил проверяет юрист.

---

## 6. Agreements и персональные данные

С 1 сентября 2025 часть 1 статьи 9 152-ФЗ требует оформлять согласие на обработку ПДн **отдельно от иной информации/документов**, которые подтверждает или подписывает субъект.

Поэтому запрещенный UX-паттерн:

```text
[✓] Я принимаю оферту, политику, согласен на обработку данных и рекламу
```

Техническая модель должна различать:

- ознакомление/принятие условий продажи — если это необходимо процессу;
- отдельное согласие на обработку ПДн, когда обработка основана именно на согласии;
- отдельное marketing consent — только добровольное, не prechecked;
- cookie/analytics preferences при необходимости.

Важно: не вся обработка ПДн обязательно строится на согласии; для исполнения договора могут быть иные законные основания. Поэтому тексты/набор checkbox определяет юрист, а система должна уметь хранить разные типы оснований/согласий, не сливая их.

`agreement_records`:

```text
id
orderId?/customerId?/requestId?
agreementType
version
textHash or documentVersionId
accepted
acceptedAt
ipHash?/userAgent?        # хранить только если юридически/операционно оправдано
source
```

---

## 7. Политика ПДн и локализация

До production:

- определить оператора ПДн;
- проверить необходимость уведомления Роскомнадзора и актуальность сведений;
- primary collection/storage российских клиентов проектировать с учетом требований локализации;
- описать перечень сторонних обработчиков: хостинг, email, платежи, аналитика, errors;
- минимизировать передачу PII;
- оформить документы и процессы удаления/уточнения/обращений субъекта;
- установить retention для заявок/логов/аккаунтов.

В README/deployment должен быть data map: какой сервис какие данные получает.

---

## 8. Платежная модель

Открытый бизнес-вопрос: 100% оплата, предоплата или оплата после подтверждения менеджером.

Поэтому код должен поддерживать `PaymentPolicy`:

```text
full_prepaid
partial_prepaid
pay_after_confirmation
manual_invoice
```

На первом production release включается только реально утвержденный режим, но схема БД не должна связывать `order.total == payment.amount` навсегда.

---

## 9. ЮKassa

Существующую интеграцию сохранить и усилить.

Требования:

- create payment server-side;
- idempotency key;
- provider payment id unique;
- return URL — только UX;
- webhook — источник изменения payment status;
- server-side reconciliation для спорных состояний;
- refund API/admin action позже по утвержденному процессу;
- test shop на staging;
- prod credentials только secret store/env production.

---

## 10. 54-ФЗ и чеки

ЮKassa в актуальной документации указывает необходимость выбрать способ отправки чеков в налоговую: сервис «Чеки от ЮKassa» либо другое решение/онлайн-касса.

Блокер production оплаты:

- выбран способ фискализации;
- бухгалтер определил НДС/предмет расчета/способ расчета для используемой схемы;
- тестовый платеж создает корректный чек;
- возврат/частичная оплата протестированы, если используются;
- ошибки фискализации видны администратору и не теряются в логах.

Не хардкодить налоговые признаки на основании предположений разработчика.

---

## 11. Made-to-order availability

Стандартная коллекция может не иметь «остатка», но быть доступной к изготовлению.

Разделять:

```text
availabilityPolicy = MADE_TO_ORDER
orderable = true
stockQty = null
```

UI: «Изготавливается под заказ».

Не писать «В наличии», если готового физического изделия нет.

Когда появится склад:

```text
IN_STOCK
MADE_TO_ORDER
TEMPORARILY_UNAVAILABLE
DISCONTINUED
```

---

## 12. Срок изготовления

Пока формулировка не утверждена, срок является setting/rule, а не JSX string.

Варианты модели:

- fixed max business days;
- range business days;
- per variant/product;
- manual confirmation.

Order snapshot сохраняет показанную пользователю формулировку/число, чтобы изменение настройки не переписало старые заказы.

---

## 13. Доставка

MVP предпочтительно не симулировать универсальный realtime calculation, если фактическая логистика еще не стандартизирована.

Возможные режимы:

### Ufa

- pickup;
- local delivery;
- installation отдельно.

### Russia

- транспортная компания;
- стоимость за счет клиента;
- exact price — после согласования, если это реальный процесс.

Checkout должен явно сообщать, входит ли доставка в `order total`.

Если доставка оплачивается отдельно позже, это отражается как отдельная сумма/обязательство, а не скрытая доплата после «Итого».

---

## 14. Возвраты / отмены / изделия с индивидуальными характеристиками

Мебель made-to-order и индивидуально-определенные свойства требуют аккуратной юридической классификации; нельзя автоматически переносить правила обычного stock ecommerce. Технически система должна поддерживать:

- cancellation request;
- reason;
- decision/status;
- partial/full refund;
- admin notes;
- attachments;
- timestamp history.

Фактические права/ограничения и текст публичных условий определяются юристом на основании конкретного товара и способа продажи.

---

## 15. Admin IA

```text
Dashboard
Orders
  All
  Needs attention
  Production
  Shipping
Catalog
  Products
  Variants
  Categories
  Materials / Options
  Media
Custom orders
Designer projects
Customers
Content
  Pages
  Blog
SEO / Feeds
Settings
  Commerce
  Delivery
  Contacts
  Legal document versions
System
  Jobs
  Payment events
  Audit log
```

Не обязательно все разделы выводить отдельным пунктом MVP, но данные должны иметь понятное место.

---

## 16. Product editor

Редактор модели должен быть безопаснее ручного ввода JSON.

Шаги:

1. Basic info;
2. Category;
3. Description;
4. Media;
5. Available options;
6. Variant matrix;
7. Prices;
8. Availability/lead time;
9. SEO;
10. Relations;
11. Preview/Publish.

Variant matrix UI:

- generate combinations только из выбранных values;
- админ может отключить невозможные combinations;
- bulk price edit допустим;
- duplicate SKU блокируется;
- price cannot be negative;
- publish blocked if active variant lacks price/SKU/required options.

---

## 17. Order admin

Карточка заказа:

### Header

- order number;
- date;
- customer;
- total;
- payment status;
- order status.

### Items

Показывать snapshots выбранных параметров, не текущие names из каталога как единственный источник.

### Workflow

- confirm;
- production status;
- delivery status;
- notes;
- customer notifications;
- payment/refund info;
- event timeline.

Опасные действия требуют confirm и audit log.

---

## 18. Custom order admin

Kanban/list statuses:

```text
new
contacted
needs_details
estimating
offer_sent
approved
rejected
converted
```

`converted` может создавать linked order/project, но только после финальной цены/конфигурации.

---

## 19. Designer project admin

Кроме статусов нужны:

- файловая лента;
- ответственный;
- internal comments;
- budget;
- target date;
- linked customer;
- linked custom order/order after conversion.

Файлы скачиваются только авторизованным admin через signed URL.

---

## 20. CMS/admin SEO

Для Product/Category/Page/Article:

- preview SERP snippet;
- title length подсказка, но не жесткий блокер;
- description;
- H1;
- index toggle with warning;
- canonical override advanced;
- OG image;
- redirect when slug changes;
- draft preview protected from index.

---

## 21. Admin settings и безопасность изменений

Критичные settings:

- payment policy;
- seller details;
- lead time;
- delivery policy;
- legal document version.

При изменении:

- audit entry;
- author;
- before/after;
- timestamp.

Для seller/payment settings желательно owner-only permission.

---

## 22. Email/notification templates

Минимум:

Customer:

- order received;
- payment success;
- payment failed/retry if appropriate;
- order confirmed;
- ready/handed to carrier;
- reset password.

Admin:

- new paid/placed order;
- payment processing failure;
- new custom request;
- new designer project;
- failed critical job.

Templates versioned. Email не должен раскрывать больше ПДн, чем нужно.

---

## 23. Legal pages inventory

До launch должны быть подготовлены и связаны с реальным продавцом:

- реквизиты/продавец;
- публичная оферта или применимые условия дистанционной продажи;
- политика обработки ПДн;
- согласие на обработку ПДн — отдельный документ/текст согласно выбранной модели;
- cookies/analytics disclosure при необходимости;
- доставка и оплата;
- гарантия;
- возврат/обмен/отмена;
- правила индивидуальных заказов, если отличаются.

Технически документы имеют version/effective date.

---

## 24. Защита от операционных ошибок

- нельзя удалить Product с order history hard delete — archive;
- нельзя удалить OptionValue, используемое active variants, без dependency warning;
- нельзя publish Product без active variant;
- cannot reduce price to 0 случайно без explicit allowed free flag;
- bulk action preview;
- admin unsaved changes warning;
- optimistic concurrency/version check для критичных order updates при нескольких менеджерах.

---

## 25. Definition of Done commerce/admin

- стандартный вариант можно купить guest user;
- order содержит immutable item snapshot;
- двойной submit не создает duplicate order/payment;
- payment webhook idempotent;
- return URL alone не ставит paid;
- receipt flow выбран и протестирован;
- manager видит variant details;
- status changes logged;
- custom project не проходит через fake price checkout;
- agreements разделены и versioned;
- legal pages доступны из checkout/footer;
- настройки срока/оплаты/контактов не хардкодятся;
- admin может полноценно создать новую модель без правки БД вручную.


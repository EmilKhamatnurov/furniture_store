# KHAMATNUROV MEBEL — Правила для AI-разработчика

Версия 1.0 • 17 сентября 2026

## 1. Назначение

Этот файл передается ChatGPT/Codex/Claude Code/другому coding agent вместе с актуальным кодом. Его задача — не дать поэтапным «быстрым» изменениям превратить проект в набор несовместимых решений.

---

## 2. Перед каждой задачей

AI обязан сначала прочитать:

1. `01_MASTER_TZ_KHAMATNUROV_MEBEL.md`;
2. профильный документ задачи;
3. этот файл;
4. `SPEC.md` проекта;
5. `CLAUDE.md`/локальные repository instructions;
6. relevant schema/migrations/tests.

Не начинать с написания кода по одному скриншоту, если изменение затрагивает business domain.

---

## 3. Source of truth

При конфликте:

1. подтвержденное новое решение в Decision Log;
2. профильное ТЗ implementation pack;
3. master ТЗ;
4. актуальная repo documentation;
5. старый код.

Если код расходится с документом, не «исправлять молча». Зафиксировать discrepancy и предложить migration.

---

## 4. Запрещено выдумывать бизнес-данные

Нельзя самостоятельно придумывать:

- цены;
- сроки;
- гарантии;
- бесплатную доставку;
- скидки;
- состав материала;
- нагрузку;
- сертификаты;
- stock;
- +25% правило, пока не утверждено;
- 100% prepayment, пока не утверждено.

Для неполных данных использовать explicit placeholder/config/draft state, но не публикуемый ложный текст.

---

## 5. Не менять платформу

Не предлагать миграцию на WordPress/Bitrix/Shopify только потому, что отдельная функция «есть плагином». Текущий архитектурный выбор — Next.js modular monolith.

Пересмотр — только отдельный ADR с новой реальной бизнес-причиной.

---

## 6. Не делать большой rewrite

Предпочитать incremental migration:

```text
add schema
→ adapter
→ migrate data
→ switch reads
→ switch writes
→ observe
→ remove legacy
```

Не удалять рабочие payment/order tables одновременно с внедрением Product v2.

---

## 7. Server-first

По умолчанию Next Server Components/server code. `use client` добавлять только компонентам, которым реально нужна browser interactivity/state/effects.

Product description, price initial state, SEO content, breadcrumbs и JSON-LD должны быть доступны в server HTML.

---

## 8. Цена только server-authoritative

Никогда:

```ts
createOrder({ variantId, price: clientPrice })
```

Всегда:

```text
client variantId
→ server fetch active variant
→ server price
→ server totals
→ snapshot
```

Client calculation — display optimization, не source of truth.

---

## 9. Variant model

Не создавать отдельный Product на каждый цвет/размер.

`Product` = модель.

`ProductVariant` = продаваемая комбинация.

Нельзя создать комбинацию, которой нет в variant matrix.

---

## 10. Orders immutable where required

Order item не должен отображать текущий Product name/price как единственный источник. Сохранять snapshot.

Не update старые order_items при изменении каталога.

---

## 11. Money

- no JS float for authoritative money;
- хранить integer minor units или строго выбранный DB decimal;
- валюту хранить явно;
- round rules централизованы;
- tests на totals.

---

## 12. Idempotency

Обязательно для:

- create order;
- create payment;
- payment webhook;
- background jobs where repeat possible.

Повторный запрос не должен создавать вторую оплату/заказ.

---

## 13. DB migrations

Каждая migration:

- additive предпочтительно;
- safe default/backfill;
- index creation planned;
- foreign key behavior explicit;
- rollback/data recovery path;
- test on production-like copy.

Не редактировать уже примененную production migration задним числом.

---

## 14. API boundaries

UI не импортирует ORM schema как domain API.

Использовать module service/DTO.

Не выполнять Drizzle query из случайного component tree, если домен уже имеет repository/service.

---

## 15. Validation

Все external inputs проверять server-side:

- params;
- query;
- form;
- JSON;
- uploads;
- webhook.

Ошибки возвращать структурированно и безопасно. Не показывать raw stack/SQL клиенту.

---

## 16. Error handling

Разделять:

- validation/business error;
- not found;
- unauthorized/forbidden;
- provider unavailable;
- internal unexpected.

Не оборачивать весь codebase в `try/catch { return null }`.

---

## 17. Logging

Логировать identifiers, не полные ПДн:

```text
requestId
orderId
paymentId
jobId
customerId (internal)
```

Не логировать:

- passwords;
- full card/payment secrets;
- auth tokens;
- full webhook secrets;
- unnecessary phone/email/address.

---

## 18. Security

Перед auth/admin/payment change:

- проверить authorization server-side;
- test anonymous/user/admin;
- rate limiting if abuse-prone;
- CSRF/session model;
- secrets;
- CSP/XSS implications.

Next.js patch level проверяется отдельно; не считать framework автоматически безопасным из-за «latest package.json range».

---

## 19. SEO non-regression

При изменении routes:

- проверить canonical;
- sitemap;
- redirects;
- structured data;
- breadcrumbs;
- internal links;
- status code;
- noindex.

Нельзя менять slug structure без redirect map.

---

## 20. Filters

Не создавать автоматически indexable URL для каждой комбинации.

Если новый filter создает query param — добавить его в SEO crawl policy.

SEO landing создается отдельной сущностью/whitelist.

---

## 21. Structured data

JSON-LD строится из authoritative server data.

Не размечать:

- fake review;
- цену, которой нет на странице;
- stock, которого нет;
- Product variant URL, который нельзя открыть с нужным state.

После изменения Product schema добавить fixture validation.

---

## 22. Accessibility

Нельзя «чинить» дизайн div-click handlers без keyboard semantics.

- button = `<button>`;
- navigation link = `<a>`/`Link`;
- form label;
- focus;
- modal accessibility;
- swatch name.

---

## 23. Performance

Перед добавлением dependency спросить:

- можно ли сделать native/platform code;
- попадает ли пакет в client bundle;
- нужен ли он на каждом route.

Не добавлять slider library ради простого CSS scroll gallery, если она приносит большой JS без необходимости.

---

## 24. Images

- `next/image`/optimized pipeline;
- width/height/aspect ratio;
- meaningful alt;
- no base64 mega-image in code;
- no hotlink third-party product photos;
- private designer files не через public image path.

---

## 25. Components

Одинаковая функция = переиспользование.

Нельзя копировать ProductCard в `HomeProductCard`, `CatalogProductCard`, `RelatedCard` с почти одинаковым кодом. Делать controlled variants композиции.

Не абстрагировать преждевременно всё подряд: component extraction должен иметь стабильную общую ответственность.

---

## 26. Tests вместе с изменением

Bug fix должен по возможности включать regression test.

Новый pricing/checkout/payment код без тестов не считается завершенным.

Минимум перед PR:

```text
typecheck
lint
tests
build
```

---

## 27. Feature completion response

AI после задачи должен сообщить:

- что изменено;
- какие файлы;
- migration;
- тесты;
- команды запуска;
- known limitations;
- manual QA steps;
- docs/Decision Log updates.

Не писать «готово», если не запускалась сборка/тесты, которые доступны.

---

## 28. Не совмещать рискованные изменения

Один release не должен одновременно без крайней необходимости включать:

- Next major upgrade;
- Product schema rewrite;
- payment rewrite;
- auth rewrite.

Разделять, чтобы можно было найти причину regression.

---

## 29. UI implementation rules

- брать tokens из design system;
- responsive not screenshot-hardcoded;
- no arbitrary fixed heights for text cards;
- support real long Russian text;
- no inline business copy duplicated across components;
- loading/error/empty states;
- reduced motion.

---

## 30. Definition of Done AI task

AI-задача завершена только когда:

- requirement understood in context;
- no unsupported business assumptions;
- code follows module boundaries;
- validation/security considered;
- tests/build executed where possible;
- SEO/a11y/performance non-regression considered;
- migration safe;
- docs updated;
- manual QA steps provided.


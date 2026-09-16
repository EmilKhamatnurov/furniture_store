# KHAMATNUROV MEBEL — Roadmap разработки, QA и запуск

Версия 1.0 • 17 сентября 2026

## 1. Принцип реализации

Проект нельзя вести по схеме «сначала нарисуем всю главную, потом как-нибудь подключим магазин». Правильная единица прогресса — вертикальный работающий slice от данных до UI и теста.

Критический путь:

```text
Security baseline
→ Inventory current code/data
→ Product model migration
→ Admin product editor
→ Product configurator
→ Cart/checkout snapshots
→ Payments/fiscalization
→ SEO/feeds
→ Content/design polish
→ Launch
```

---

## 2. Phase 0 — Baseline и безопасность

### Задачи

- зафиксировать production/staging topology;
- создать backup текущей БД;
- `npm ci` clean baseline;
- typecheck/lint/test/build;
- security patch Next.js 15.5.19 → минимум 15.5.24 или актуальный безопасный maintenance patch;
- dependency audit;
- smoke existing flows;
- зафиксировать Lighthouse/Web Vitals baseline;
- зафиксировать ERD;
- перечень env/secrets без значений;
- restore test staging DB.

### Выход

`BASELINE_REPORT.md`:

- commit hash;
- test results;
- known failures;
- current routes;
- current tables;
- current payment flow;
- screenshots critical pages;
- performance numbers.

### Gate

Никакой большой migration, пока current app не собирается воспроизводимо.

---

## 3. Phase 1 — Бизнес-решения и контент inventory

Закрыть блокеры B01–B10 из Decision Log настолько, насколько они нужны следующему этапу.

Создать spreadsheet/catalog source of truth:

- model name;
- parent SKU;
- category;
- standard sizes;
- materials;
- colors;
- finishes;
- allowed combinations;
- exact price each combination;
- photos;
- lead time;
- descriptions;
- notes.

До этого variant migration нельзя считать готовой.

---

## 4. Phase 2 — Data model v2

### Backend

- option definitions/values;
- product-option links;
- variant-option links;
- price/availability;
- media binding;
- settings;
- order snapshot extension.

### Migration

- additive SQL;
- seed reference options;
- migration script existing demo products;
- validation report impossible/duplicate variants.

### Tests

- unique variant combination;
- required axes;
- min price;
- disabled variant;
- snapshot serialization.

### Gate

No storefront switch until admin can safely manage new data.

---

## 5. Phase 3 — Admin Catalog v2

Implement product editor/variant matrix/media/SEO.

Acceptance scenario:

> Контент-менеджер без доступа к коду создает модель стола, добавляет три размера, два материала, четыре оттенка, исключает невозможные сочетания, вводит цены, загружает фотографии, задает metadata, публикует. После публикации модель появляется на staging и все варианты корректно доступны.

QA:

- required fields;
- duplicate SKU;
- duplicate combination;
- publish validation;
- archive;
- slug redirect;
- permissions.

---

## 6. Phase 4 — Design foundations

Параллельно после data contracts:

- visual moodboard;
- typography test Cyrillic;
- colors;
- grid;
- photography art direction;
- component library;
- header/footer;
- ProductCard;
- form controls;
- selectors;
- accessibility states.

Design freeze не означает запрет улучшений; он означает, что foundation tokens/components согласованы до массовой верстки.

---

## 7. Phase 5 — Catalog + Product vertical slice

Реализовать сначала **одну реальную категорию + одну полностью заполненную модель**.

Почему: она выявит проблемы variant matrix, фотографии, SEO и mobile раньше, чем будут сверстаны 20 пустых страниц.

Задачи:

- category SSR;
- filters;
- ProductCard;
- product SSR;
- gallery;
- configurator;
- query preselection;
- exact price;
- add-to-cart;
- JSON-LD;
- analytics events.

QA matrix:

- every variant;
- invalid query;
- disabled values;
- mobile selectors;
- no JS / slow JS basic server content;
- social preview;
- rich results validation.

---

## 8. Phase 6 — Cart + Checkout v2

- variant snapshot display;
- server repricing;
- guest checkout;
- contact/delivery forms;
- separated agreements;
- order idempotency;
- order snapshot;
- confirmation page/order number;
- email.

E2E:

```text
open category
→ product
→ select exact variant
→ add
→ cart
→ checkout
→ order created
→ verify DB snapshots
```

До платежа этот flow должен быть стабилен.

---

## 9. Phase 7 — Payments + fiscalization

Только после утверждения B01/B09.

- payment policy implementation;
- ЮKassa test;
- webhook;
- reconciliation;
- receipts solution;
- refund/cancel minimal path;
- admin payment events;
- failure recovery.

E2E cases:

1. successful payment;
2. user closes provider page;
3. return before webhook;
4. webhook repeated;
5. failed payment → retry;
6. amount mismatch impossible;
7. receipt provider error visible;
8. refund test if release supports it.

---

## 10. Phase 8 — Custom Orders / Designers

- public designer page;
- custom order CTA from product;
- files;
- private storage;
- admin queues/status;
- notifications;
- analytics.

Security test file upload:

- MIME spoof;
- huge file;
- executable extensions;
- unauthorized download;
- random signed URL expiry.

---

## 11. Phase 9 — Full content/site pages

После коммерческого ядра:

- home;
- about;
- materials;
- delivery/payment;
- warranty;
- contacts;
- blog template;
- first articles;
- production page if enough material.

Не задерживать working shop ради 30 статей. SEO content can expand post-launch.

---

## 12. Phase 10 — SEO infrastructure

Многое реализуется параллельно, но отдельный audit перед launch:

- URL map;
- redirects;
- canonical;
- robots;
- sitemap;
- Schema;
- YML;
- analytics;
- Search Console/Yandex Webmaster;
- noindex staging/service routes;
- 404;
- page titles;
- internal links.

---

## 13. Phase 11 — Performance hardening

Test routes:

- `/`;
- biggest category;
- image-heavy Product;
- cart;
- checkout;
- long article.

Budgets:

- LCP good target ≤2.5s;
- INP ≤200ms;
- CLS ≤0.1;
- JS bundle budget per route tracked, not arbitrary universal number;
- image bytes controlled;
- no unnecessary third-party scripts before consent/need.

Tools:

- Lighthouse CI lab;
- browser performance trace for selector/checkout;
- real-user Web Vitals after launch.

---

## 14. Phase 12 — Security / privacy QA

Checklist:

- auth bypass;
- IDOR order endpoints;
- admin auth/RBAC;
- file upload;
- XSS CMS;
- CSRF;
- rate limits;
- password reset;
- session revoke;
- secrets;
- logs PII;
- CSP;
- webhook authentication/idempotency;
- dependency vulnerabilities;
- backup access.

Не проводить destructive pentest against production customer data.

---

## 15. Browser/device QA

Desktop:

- current Chrome;
- Safari current;
- Firefox current;
- Edge current.

Mobile:

- iOS Safari representative recent devices;
- Android Chrome representative mid-range viewport/performance.

Resolutions не являются единственным QA — проверить dynamic text, zoom, touch, keyboard.

---

## 16. Functional test suites

### Catalog

- category visibility;
- filter;
- sort;
- variant availability;
- price.

### Cart

- guest persistence;
- add same variant;
- different variants same product;
- remove/update qty;
- repricing.

### Checkout

- validation;
- agreements;
- double submit;
- invalid cart;
- server failure.

### Payment

- webhook idempotency;
- payment retry;
- success/failure.

### Admin

- CRUD with archive;
- variant matrix;
- order status;
- audit.

### SEO

- status/canonical/robots/schema.

---

## 17. Automated testing pyramid

### Unit

- pricing;
- variant resolution;
- settings;
- serializers;
- order status transitions.

### Integration

- DB repositories;
- create order transaction;
- webhook;
- admin publish validation;
- feed generation.

### E2E

Не пытаться e2e-тестировать каждую мелочь. Critical journeys:

1. standard purchase;
2. payment success;
3. payment retry;
4. admin creates/publishes product;
5. custom request;
6. account order view.

---

## 18. Feature flags

Для рискованных модулей:

- new product configurator;
- online payment;
- designer upload;
- new checkout;
- stock availability future.

Flags server-controlled. Удалять старые flags после стабилизации, иначе появляется permanent complexity.

---

## 19. Staging

Staging максимально production-like:

- same Next/Docker topology;
- separate DB/Redis/S3 prefix;
- test payments;
- email sandbox/test recipient rules;
- protected access;
- noindex;
- realistic anonymized/demo catalog.

Не использовать production DB dump с реальными ПДн на публичном staging.

---

## 20. Content freeze перед launch

За 1 release candidate до запуска:

- model names;
- prices;
- standard variants;
- delivery text;
- lead time;
- contacts;
- seller details;
- legal docs;
- primary photography;
- titles/descriptions core pages.

После freeze изменения проходят через change log, чтобы QA не проверял постоянно меняющуюся цель.

---

## 21. Prelaunch checklist

### Infrastructure

- domain/DNS;
- TLS;
- backups;
- restore tested;
- monitoring;
- cron/worker;
- S3 policies;
- production secrets.

### Commerce

- test live low-value transaction if legally/operationally acceptable;
- receipt;
- email;
- order admin;
- refund procedure documented;
- support contacts.

### SEO

- index enabled only production;
- sitemap;
- robots;
- Search Console/Webmaster;
- schema;
- redirects.

### Legal

- seller info;
- documents;
- consent UI;
- privacy;
- cookies/analytics;
- checkout confirmation.

### UX

- mobile;
- forms;
- 404/500;
- empty state;
- slow network;
- accessibility sanity.

---

## 22. Release strategy

Рекомендуется soft launch:

1. production deployed;
2. access to owner/team;
3. live payment sanity;
4. 24–48h internal validation without advertising;
5. open indexation;
6. submit sitemaps/feeds;
7. gradual traffic/ads.

Не делать DNS switch, payment prod migration, major Next upgrade и data migration в один момент.

---

## 23. Postlaunch first 14 days

Daily:

- errors;
- payment/webhook;
- orders;
- 404;
- job failures;
- feed status.

Every few days:

- index coverage;
- canonical issues;
- Yandex diagnostics;
- CWV real data when appears;
- funnel drop-offs;
- site search queries if implemented.

Bug priority:

P0 — money/data/security/order loss.

P1 — cannot buy/core page inaccessible/SEO-wide indexing issue.

P2 — degraded UX but workaround.

P3 — cosmetic/content.

---

## 24. Post-MVP backlog

Не включать в critical path без необходимости:

- wishlists;
- reviews;
- promo codes;
- inventory warehouse;
- automated shipping APIs;
- CRM integration;
- 1C integration;
- B2B designer cabinet;
- loyalty;
- advanced onsite search;
- 3D/AR;
- material sample ordering;
- multi-language;
- international sales.

Каждый feature проходит ROI/complexity review.

---

## 25. Milestone Definition of Done

Милestone считается завершенным не по «страница выглядит готовой», а если:

- code merged;
- migrations reversible/backup plan;
- tests green;
- staging QA passed;
- owner acceptance scenario passed;
- documentation updated;
- analytics/SEO included where relevant;
- no open P0/P1 defects.


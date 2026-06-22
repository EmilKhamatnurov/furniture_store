# Мебельный интернет-магазин — Спецификация

> Версия: черновик от 2026-06-13
> Стек: Next.js 15 (App Router) · React 19 · TypeScript · PostgreSQL + Drizzle ORM · Redis · BullMQ

---

## 1. Назначение и контекст

Интернет-магазин мебели российского производства с полным циклом: каталог → корзина → оформление → онлайн-оплата (YuKassa) → уведомления → личный кабинет → админка.

**Целевая аудитория:** покупатели мебели в РФ (B2C).
**Юрисдикция:** РФ — требования 152-ФЗ (персональные данные), 54-ФЗ (онлайн-чеки), оферта/согласия.

### Ключевые принципы архитектуры

| Принцип | Реализация |
|---------|------------|
| **Модульный монолит** | Код разбит на домены `src/modules/*` (catalog, cart, orders, payments, customers, shipping, cms, email). Каждый модуль владеет своей схемой БД и публичным API через `index.ts` (barrel). |
| **Server-first** | По умолчанию серверные компоненты. `"use client"` — только там, где нужна интерактивность (корзина, формы, кнопки). |
| **Граница client/server** | `import "server-only"` защищает серверные модули. Клиентский код использует только `NEXT_PUBLIC_*` напрямую, минуя валидатор `env.ts`. |
| **Деньги в копейках** | Все суммы — `bigint` в копейках. Сериализация для JSON/localStorage/FormData: `bigint → string → bigint`. |
| **Снимки данных** | Цены и состав заказа фиксируются на момент покупки (order_items дублирует название/цену), чтобы быть независимыми от живого каталога. |
| **Идемпотентность** | Платежи и вебхуки защищены уникальными ключами и дедупликацией. |
| **PII-безопасность** | Логгер (pino) маскирует телефон/адрес/ФИО/карты. Полные данные — только в БД. |

---

## 2. Технологический стек

- **Frontend/SSR:** Next.js 15 App Router, React 19 (`useActionState`, Server Actions)
- **Стили:** Tailwind CSS + CSS-переменные (HSL) для тем
- **UI-примитивы:** Radix UI (Dialog, Select, Label, Toast, Dropdown)
- **БД:** PostgreSQL + Drizzle ORM (relational queries, `db.query.*`)
- **Кэш:** Redis (ioredis) — каталог, с сериализацией BigInt
- **Очереди:** BullMQ (email, sms, notification) на Redis
- **Платежи:** YuKassa REST API v3
- **Email:** Unisender Go
- **SMS:** SMS Aero (опционально)
- **Логи:** pino + pino-pretty
- **Тесты:** Vitest
- **Валидация:** Zod
- **Инфраструктура (dev):** Docker Compose (postgres + redis)

---

## 3. Доменная модель (схемы БД)

### catalog
- `categories` — дерево категорий (slug, parent)
- `products` — товары (slug, описание, SEO)
- `product_variants` — варианты (SKU, цена в копейках, остаток)
- `product_images` — изображения (S3-ключи)

### orders
- `orders` — заказ. Машина состояний:
  `draft → pending_payment → paid → assembling → shipped → delivered → completed`
  Терминальные: `cancelled`, `refunded`. Адрес хранится снимком (jsonb `ShippingAddress`).
- `order_items` — позиции (снимок названия/цены/SKU)
- `order_events` — неизменяемый аудит-лог переходов (actor: customer/admin/system)

### payments
- `payments` — платёж YuKassa. Статусы: `pending, waiting_for_capture, succeeded, cancelled, refunded, partially_refunded`. Уникальные индексы по `yukassa_payment_id` и `idempotency_key`.
- `payment_webhook_events` — лог вебхуков с дедупликацией по `external_event_id`.

### customers
- `customers` — клиенты (email, hash пароля — для будущего ЛК)
- `customer_consents` — согласия 152-ФЗ (тип, hash текста, версия политики, IP, granted/revoked)

### shipping
- `shipping_zones`, `shipping_tariffs`, `shipping_settings` — зоны и тарифы доставки

### cms
- `pages` — статические страницы
- `blog_posts` — блог

---

## 4. Реализованные этапы

### ✅ Этап 1 — Схема БД
Полная схема Drizzle для всех доменов, миграции, seed-скрипт.

### ✅ Этап 2 — Каталог
- Страницы: `/catalog`, `/catalog/[category]`, `/catalog/[category]/[product]`
- Компоненты: карточка товара, галерея, выбор варианта
- Redis-кэш с сериализацией BigInt
- SEO: метаданные, JSON-LD, хлебные крошки

### ✅ Этап 3 — Корзина
- `modules/cart/store.tsx` — `useReducer` + Context, localStorage (`furniture_cart_v1`)
- Гидрация без рассинхрона SSR (флаг `hydrated`)
- Radix Dialog drawer, страница `/cart`, бейдж с количеством в шапке

### ✅ Этап 4 — Оформление заказа
- `/checkout` — форма (Zod-валидация), `useActionState`
- Server Action `checkoutAction` → `createOrder()` → запись в БД → redirect
- Генерация номера заказа `FS-YYYY-NNNNN`
- Страница подтверждения `/orders/[orderId]` + очистка корзины

### ✅ Этап 5 — Оплата (YuKassa)
- `modules/payments/yukassa-client.ts` — REST-клиент (Basic Auth, Idempotence-Key)
- `modules/payments/repository.ts` — записи платежей, переходы заказа, лог вебхуков
- Server Action `initiatePaymentAction` → создание платежа → redirect на форму YuKassa
- `pay-button.tsx` — клиентская кнопка оплаты
- `/api/payments/yukassa/webhook` — обработчик с верификацией (повторный запрос к API) и дедупликацией
- `/orders/[orderId]/payment-result` — return URL
- Статус-зависимый UI страницы заказа

### ✅ Этап 6 — Email-уведомления
- Модуль `src/modules/email/` — клиент Unisender Go, HTML+text шаблоны (подтверждение заказа, оплата получена, уведомление админу)
- Воркер `worker/index.ts` + `worker/processors/email.ts` — обработка очереди BullMQ
- Шаблоны рендерятся при постановке задачи (где есть данные заказа), воркер «тупой»
- Триггеры: подтверждение заказа (checkout), оплата получена + уведомление админу (webhook)
- Идемпотентность через `jobId = email:<тип>:<orderId>`
- `worker/bootstrap.ts` грузит `.env.local`; воркер запускается с `--conditions=react-server` (нейтрализует `server-only`)
- Redis переведён на `noeviction` (требование BullMQ)

### ✅ Этап 7 — Личный кабинет
- Модуль `src/modules/auth/` — пароли (Node `scrypt`, без нативных зависимостей), сессии (подписанная HMAC-SHA256 кука на `APP_SECRET`, без таблицы сессий)
- Модуль `src/modules/customers/` — репозиторий (create/get/update, согласия 152-ФЗ, `getCurrentCustomer`)
- Страницы `/login`, `/register` (route-group `(auth)`) с Zod-валидацией и `useActionState`
- Защищённая зона `/account/*`: обзор, история заказов, профиль; guard в layout
- Регистрация фиксирует согласие на обработку ПД (hash текста + версия + IP)
- Заказы привязываются к клиенту (`orders.customerId`); история матчится по `customerId` ИЛИ email (гостевые заказы тоже видны)
- Интеграция в шапку (иконка кабинета / вход), logout через server action

### ✅ Этап 8 — Админ-панель
- Модуль `src/modules/admin/` — auth (env-логин: `ADMIN_EMAIL` + scrypt-хэш `ADMIN_PASSWORD_HASH`), отдельная подписанная кука `fs_admin` (12 ч), data-access (orders, catalog, payments, stats)
- Доступ: один доверенный админ; пароль-хэш генерируется `npm run admin:hash -- "пароль"`
- Маршруты `/admin/*` отделены от витрины; guard в layout route-group `(dashboard)`, страница `/admin/login` вне guard
- **Дашборд**: счётчики (заказы, выручка по оплаченным, требуют отгрузки) + последние заказы
- **Заказы**: список с фильтром по статусу и пагинацией; детальная страница со сменой статуса (валидация переходов + запись в `order_events`), внутренние заметки, история событий, платежи
- **Товары**: список (вкл. скрытые/архив); редактирование основного (название, цена, категория, активность) и вариантов (цена/остаток/активность) с инвалидацией Redis-кэша
- **Платежи**: read-only список со связью с заказами
- Машина переходов статусов: `draft→cancelled`, `pending_payment→paid|cancelled`, `paid→assembling|cancelled|refunded`, `assembling→shipped|…`, и т.д.; финальные статусы неизменяемы

### ✅ Этап 9 — Контент
- Модуль `src/modules/cms/` — публичные чтения (только опубликованное): `getPublishedPageBySlug`, `listPublishedPosts`, `getPublishedPostBySlug`, слаги для sitemap
- Модуль `src/modules/admin/content.ts` — CRUD страниц и статей (вкл. черновики); `publishedAt` проставляется при первой публикации
- **Статические страницы**: `app/(shop)/[slug]` — оферта, доставка, возврат, о компании, контакты, политика (ISR `revalidate=300`, busted через `revalidatePath`). Статические роуты (`/cart`, `/login`, …) имеют приоритет над `[slug]`
- **Блог**: `/blog` (список) + `/blog/[postSlug]` (статья с Article-разметкой schema.org)
- HTML-контент рендерится через `dangerouslySetInnerHTML` (доверенный автор-админ) со стилями `.cms-content` в `globals.css` (без `@tailwindcss/typography`)
- Админ-управление: раздел «Контент» (список страниц/статей, создание/редактирование, переключатель публикации)
- SEO: `generateMetadata` (meta + OG + canonical), хлебные крошки, sitemap дополнен опубликованными страницами и статьями
- Сид наполняет 6 страниц + 3 статьи блога

---

## 5. Планируемые этапы

### Сквозные задачи (опционально)
- Доставка: расчёт по зонам/тарифам (сейчас «уточняется»)
- 54-ФЗ: чеки в платеже YuKassa (receipt)
- Мониторинг: GlitchTip (Sentry-совместимый)
- Аналитика: Яндекс.Метрика

---

## 6. Переменные окружения

| Переменная | Назначение | Обязательна |
|------------|-----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Базовый URL приложения | да |
| `NEXT_PUBLIC_S3_BASE_URL` | База для медиа (пусто в dev → плейсхолдеры) | нет |
| `APP_SECRET` | Секрет для сессий (≥32 симв.) | да |
| `DATABASE_URL` | PostgreSQL | да |
| `REDIS_URL` | Redis (кэш + очереди) | да |
| `S3_*` | Объектное хранилище (Selectel) | prod |
| `YUKASSA_SHOP_ID` / `YUKASSA_SECRET_KEY` | Платежи | prod |
| `YUKASSA_WEBHOOK_SECRET` | Верификация вебхуков | prod |
| `UNISENDER_API_KEY` / `EMAIL_FROM*` | Email | prod |
| `ADMIN_EMAIL` | Уведомления о заказах + логин в админку | нет |
| `ADMIN_PASSWORD_HASH` | scrypt-хэш пароля админки (`npm run admin:hash`) | нет |
| `SMS_AERO_*` | SMS | нет |
| `GLITCHTIP_DSN` | Мониторинг ошибок | нет |
| `NEXT_PUBLIC_METRIKA_COUNTER_ID` | Яндекс.Метрика | нет |

Валидация — Zod в `src/config/env.ts` (`server-only`). В dev необязательные prod-секреты допускают пустые значения.

---

## 7. Структура проекта

```
src/
  app/
    (shop)/            # витрина: каталог, корзина, чекаут, заказы
      (auth)/          # /login, /register (route-group, центрир. layout)
      account/         # защищённый ЛК: обзор, заказы, профиль
      [slug]/          # статические страницы (about, delivery, …)
      blog/            # /blog и /blog/[postSlug]
    admin/             # админ-панель
      login/           # /admin/login (вне guard)
      (dashboard)/     # guarded: дашборд, заказы, товары, платежи, контент
    api/               # health, payments/yukassa/webhook
    layout.tsx         # CartProvider, шрифты, темы
  modules/             # домены (catalog, cart, orders, payments, auth,
                       #         customers, email, admin, cms, …)
    <module>/
      db/schema.ts     # таблицы Drizzle
      repository.ts    # запись в БД (server-only)
      ui/              # компоненты модуля
      index.ts         # публичный API (barrel)
  components/          # ui/ (Radix-обёртки), layout/, seo/
  lib/
    db/                # drizzle client + barrel схем
    redis/             # клиент кэша
    logger/            # pino + маскирование PII
    utils/             # money, urls, images, cn
  config/env.ts        # валидация env (server-only)
worker/
  bootstrap.ts         # загрузка .env.local
  queues/index.ts      # BullMQ очереди
  processors/email.ts  # обработчик email-задач
  index.ts             # точка входа воркера (npm run worker)
```

---

## 8. Команды

```bash
docker compose up -d postgres redis   # поднять инфраструктуру
npm run dev                           # Next.js dev-сервер
npm run worker                        # BullMQ воркер
npm run db:generate / db:migrate      # миграции Drizzle
npm run db:seed                       # тестовые данные
npm run admin:hash -- "пароль"        # сгенерировать ADMIN_PASSWORD_HASH
npm run type-check / test / lint      # проверки
```

> **Доступ в админку (dev):** `/admin/login`, email `admin@example.com`, пароль `admin12345` (заданы в `.env.local`). Для смены — `npm run admin:hash -- "новый-пароль"` и вставить хэш в `ADMIN_PASSWORD_HASH`.

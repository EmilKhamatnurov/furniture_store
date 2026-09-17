# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Всегда отвечай на русском

## Overview

Furniture e-commerce shop for the Russian market (B2C): catalog → cart → checkout → online payment (YuKassa) → notifications → customer account → admin panel. Built as a **modular monolith** on Next.js 15 (App Router) + React 19 + TypeScript + PostgreSQL/Drizzle + Redis + BullMQ.

`SPEC.md` is the authoritative spec (in Russian) — read it for domain detail, the implemented stages (1–9), and the full env-var table. `DEPLOY.md` covers production deployment.

## Commands

```bash
docker compose up -d postgres redis   # local infra (Postgres + Redis) — required before dev
npm run dev                           # Next.js dev server
npm run worker                        # BullMQ worker process (separate from the app)
npm run db:generate                   # generate Drizzle migration from schema changes
npm run db:migrate                    # apply migrations
npm run db:seed                       # seed test data (products, pages, blog posts)
npm run db:studio                     # Drizzle Studio
npm run admin:hash -- "password"      # generate ADMIN_PASSWORD_HASH for admin login

npm run type-check                    # tsc --noEmit (strict; exactOptionalPropertyTypes, noUncheckedIndexedAccess)
npm run lint                          # next lint
npm run test                          # vitest run (one-shot)
npm run test:watch                    # vitest watch
npx vitest run src/lib/utils/__tests__/money.test.ts   # run a single test file
```

Dev admin access: `/admin/login`, `admin@example.com` / `admin12345` (set in `.env.local`).

## Architecture

### Module boundaries (`src/modules/*`)
Each domain (`catalog`, `cart`, `orders`, `payments`, `customers`, `shipping`, `cms`, `email`, `admin`, `auth`) owns its DB schema and exposes a **public API through `index.ts` (barrel)**. Other modules and app code must import from the barrel, never from a module's internals (`./db/*`, `./repository`). A typical module:

```
<module>/
  db/schema.ts     # Drizzle tables for this domain
  repository.ts    # DB reads/writes (server-only)
  domain/          # pure helpers + domain types
  ui/              # module's React components
  index.ts         # public API barrel
```

`src/lib/db/schema.ts` barrel-re-exports every module's `db/schema` so Drizzle's relational query builder (`db.query.*`) sees the full schema. When you add a table to a module, also export it there.

### Client/server boundary
- Server-first: components are Server Components by default; `"use client"` only for interactivity (cart, forms, buttons).
- `import "server-only"` guards server modules (db client, repositories, caches, `config/env`). Client code reads `NEXT_PUBLIC_*` directly, bypassing the `env.ts` validator.
- Mutations use **Server Actions** with Zod schemas (often a colocated `schema.ts`) and React 19 `useActionState`.

### Money: bigint kopecks everywhere
All monetary values are `bigint` in kopecks (копейки) end-to-end. Convert to rubles only at the UI render boundary via `src/lib/utils/money.ts` (`formatRub`, `rubToKopecks`, etc.). JSON/localStorage/FormData cannot carry bigint, so the boundary is `bigint → string → bigint`. **When reading from Redis cache, bigint fields come back as strings and must be re-hydrated** — see `reviveProductBigInts` in `src/modules/catalog/db/cache.ts`.

### Caching
Catalog reads go through `modules/catalog/db/cache.ts`: cache miss → DB → cache set; **cache failures fall through to DB (never throw)**. Admin mutations must call `invalidateProductCache` / `invalidateCategoryCache` after writing. CMS static pages use ISR (`revalidate=300`) busted via `revalidatePath`.

### Worker process (BullMQ)
`worker/` runs as a **separate process** (`npm run worker`), not inside Next.js. Order of concerns matters:
- `worker/index.ts` first line is `import "@worker/bootstrap"` which loads `.env.local` **before** `config/env` validates.
- The worker is started with `--conditions=react-server` to neutralize `server-only` (lets it import server modules). Any `tsx` script touching server modules needs this flag (see `admin:hash`, `start:worker`).
- Email templates are rendered **at enqueue time** (where order data lives); the worker is "dumb". Idempotency via `jobId = email:<type>:<orderId>`.
- Redis must run with `noeviction` (BullMQ requirement).

### Data snapshots & state machines
- Order placement snapshots data: `order_items` duplicate name/price/SKU; shipping address is a jsonb snapshot — independent of the live catalog. **All snapshots (prices, names, SKU) are re-read from the DB at checkout — never trust client-supplied cart data** (client sends only `variantId` + `quantity`, see `parseCartLines` in `(shop)/checkout/schema.ts`).
- Order status is a state machine (`draft → pending_payment → paid → assembling → shipped → delivered → completed`; terminal: `cancelled`, `refunded`). Admin transitions are validated in `modules/admin/orders.ts` (`allowedTransitions`); the payment webhook only advances `draft`/`pending_payment` → `paid` (guarded SQL update). All transitions append to the immutable `order_events` audit log; `modules/orders/status.ts` holds presentation labels only. Payment webhooks are idempotent (unique `idempotency_key`, deduped by `external_event_id`) and verify the captured amount against the payment record.
- Order numbers (`FS-YYYY-NNNNN`) come from the `order_number_seq` Postgres sequence; `createOrder` runs in a single transaction.

### Auth (two separate systems)
- **Customer** (`modules/auth`): Node `scrypt` passwords (no native deps), stateless sessions via an HMAC-SHA256-signed cookie over `APP_SECRET` (no session table). Protected `/account/*` guarded in its layout.
- **Admin** (`modules/admin`): single trusted admin from env (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`), separate signed `fs_admin` cookie (12h). `/admin/(dashboard)/*` guarded in layout; `/admin/login` sits outside the guard.

### Security
- `src/middleware.ts` sets a per-request nonce CSP (no `unsafe-inline` for scripts). The `JsonLd` component reads the nonce from the `x-nonce` header.
- PII (phone/address/name/cards) is masked by the pino logger (`src/lib/logger`); full data lives only in the DB.
- Trusted admin-authored CMS HTML is rendered with `dangerouslySetInnerHTML`, sanitized via `src/lib/security/sanitize-html.ts`, styled by `.cms-content` in `globals.css`.

## Conventions
- Path aliases: `@/*` → `src/*`, `@db/*` → `db/*`, `@worker/*` → `worker/*` (mirrored in `tsconfig.json` and `vitest.config.ts`).
- Routes use App Router route groups: `(shop)` storefront, `(auth)` login/register, `(dashboard)` guarded admin. Static routes (`/cart`, `/login`, …) take priority over the catch-all `(shop)/[slug]` CMS page route.
- Tests are Vitest, colocated in `__tests__/`, run sequentially (`pool: "forks"`) to avoid DB races.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

/**
 * Seed script — populates the DB with demo categories, products, and variants.
 * Usage: npm run db:seed
 *
 * Idempotent: re-running will not duplicate records (uses fixed UUIDs).
 */
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import Redis from "ioredis";
config({ path: ".env.local" });

// IMPORTANT: db must be imported AFTER dotenv.config() so DATABASE_URL is set.
// Top-level import would be hoisted before config() runs — use require() here
// to defer module evaluation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { db, closeDb } = require("@/lib/db/script") as typeof import("@/lib/db/script");
const {
  categories,
  products,
  productVariants,
  productImages,
  pages,
  blogPosts,
  shippingZones,
  shippingTariffs,
  shippingSettings,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("@/lib/db/schema") as typeof import("@/lib/db/schema");

// Stable UUIDs so re-runs are idempotent.
const CAT_SOFAS = "11111111-0000-0000-0000-000000000001";
const CAT_ARMCHAIRS = "11111111-0000-0000-0000-000000000002";
const CAT_TABLES = "11111111-0000-0000-0000-000000000003";
const CAT_BEDS = "11111111-0000-0000-0000-000000000004";
const CAT_STORAGE = "11111111-0000-0000-0000-000000000005";

async function seed() {
  console.log("🌱 Seeding database...");

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  await db
    .insert(categories)
    .values([
      {
        id: CAT_SOFAS,
        slug: "divany",
        name: "Диваны",
        description:
          "Авторские диваны ручной работы из натурального дерева и качественного текстиля.",
        metaTitle: "Диваны ручной работы — KHAMATNUROV MEBEL",
        metaDescription:
          "Тестовый каталог мебели: характеристики и условия доставки будут уточнены перед production.",
        sortOrder: 10,
        isActive: true,
      },
      {
        id: CAT_ARMCHAIRS,
        slug: "kresla",
        name: "Кресла",
        description: "Удобные кресла для дома и кабинета.",
        metaTitle: "Кресла ручной работы",
        metaDescription:
          "Дизайнерские кресла из массива дерева. Авторский пошив обивки.",
        sortOrder: 20,
        isActive: true,
      },
      {
        id: CAT_TABLES,
        slug: "stoly",
        name: "Столы",
        description:
          "Обеденные и журнальные столы из массива.",
        metaTitle: "Столы из массива дерева — KHAMATNUROV MEBEL",
        metaDescription:
          "Столы ручной работы из дуба, ореха, ясеня. Изготовление под индивидуальные размеры.",
        sortOrder: 30,
        isActive: true,
      },
      {
        id: CAT_BEDS,
        slug: "krovati",
        name: "Кровати",
        description: "Кровати из массива с мягким изголовьем.",
        sortOrder: 40,
        isActive: true,
      },
      {
        id: CAT_STORAGE,
        slug: "hranenie",
        name: "Хранение",
        description: "ТВ-тумбы и комоды из дубового шпона.",
        metaTitle: "Тумбы и комоды — KHAMATNUROV MEBEL",
        metaDescription:
          "Тестовая витрина тумб и систем хранения: характеристики взяты из предоставленных визуализаций.",
        sortOrder: 50,
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Categories seeded");

  // -------------------------------------------------------------------------
  // Products + variants + images
  // -------------------------------------------------------------------------
  const productData = [
    {
      id: "22222222-0000-0000-0000-000000000001",
      slug: "divan-bergen",
      name: "Диван «Берген»",
      description:
        "Двухместный диван с обивкой из велюра и каркасом из массива бука. Лаконичный силуэт в скандинавском духе.",
      categoryId: CAT_SOFAS,
      basePriceCopecks: 8990000n, // 89 900 ₽
      lengthCm: 200,
      widthCm: 90,
      heightCm: 85,
      weightGrams: 65000,
      sortOrder: 10,
      attributes: [
        { name: "Каркас", value: "Массив бука" },
        { name: "Наполнитель", value: "ППУ + холлофайбер" },
        { name: "Гарантия", value: "2 года" },
      ],
      variants: [
        {
          sku: "DVN-BRG-OAK-GREY",
          label: "Дуб / Серый велюр",
          options: [
            { name: "Дерево", value: "Дуб" },
            { name: "Обивка", value: "Серый велюр" },
          ],
          stockQuantity: 3,
        },
        {
          sku: "DVN-BRG-OAK-BEIGE",
          label: "Дуб / Бежевый велюр",
          options: [
            { name: "Дерево", value: "Дуб" },
            { name: "Обивка", value: "Бежевый велюр" },
          ],
          stockQuantity: 2,
        },
        {
          sku: "DVN-BRG-WAL-GREY",
          label: "Орех / Серый велюр",
          options: [
            { name: "Дерево", value: "Орех" },
            { name: "Обивка", value: "Серый велюр" },
          ],
          priceCopecks: 9490000n, // walnut variant +5000₽
          stockQuantity: 1,
        },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000002",
      slug: "kreslo-aalto",
      name: "Кресло «Аалто»",
      description:
        "Эргономичное кресло из массива ясеня с тканевой обивкой. Подходит для гостиной и кабинета.",
      categoryId: CAT_ARMCHAIRS,
      basePriceCopecks: 4290000n, // 42 900 ₽
      lengthCm: 80,
      widthCm: 85,
      heightCm: 90,
      weightGrams: 22000,
      sortOrder: 10,
      attributes: [
        { name: "Каркас", value: "Массив ясеня" },
        { name: "Высота сиденья", value: "42 см" },
      ],
      variants: [
        {
          sku: "KRS-AAL-ASH-GREY",
          label: "Ясень / Графит",
          options: [
            { name: "Дерево", value: "Ясень" },
            { name: "Обивка", value: "Графит" },
          ],
          stockQuantity: 5,
        },
        {
          sku: "KRS-AAL-ASH-OLIVE",
          label: "Ясень / Олива",
          options: [
            { name: "Дерево", value: "Ясень" },
            { name: "Обивка", value: "Олива" },
          ],
          stockQuantity: 4,
        },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000003",
      slug: "stol-helsinki",
      name: "Стол «Хельсинки»",
      description:
        "Обеденный стол из массива дуба. Натуральная фактура дерева, масляное покрытие.",
      categoryId: CAT_TABLES,
      basePriceCopecks: 5990000n, // 59 900 ₽
      lengthCm: 180,
      widthCm: 90,
      heightCm: 75,
      weightGrams: 45000,
      sortOrder: 10,
      attributes: [
        { name: "Материал", value: "Массив дуба" },
        { name: "Покрытие", value: "Натуральное масло" },
        { name: "Размер", value: "180 × 90 см" },
      ],
      variants: [
        {
          sku: "STL-HEL-OAK-180",
          label: "Дуб 180 см",
          options: [
            { name: "Дерево", value: "Дуб" },
            { name: "Длина", value: "180 см" },
          ],
          stockQuantity: 2,
        },
        {
          sku: "STL-HEL-OAK-220",
          label: "Дуб 220 см",
          options: [
            { name: "Дерево", value: "Дуб" },
            { name: "Длина", value: "220 см" },
          ],
          priceCopecks: 6990000n,
          lengthCm: 220,
          stockQuantity: 1,
        },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000004",
      slug: "krovat-fjord",
      name: "Кровать «Фьорд»",
      description:
        "Двуспальная кровать с мягким изголовьем и основанием из массива.",
      categoryId: CAT_BEDS,
      basePriceCopecks: 7490000n,
      lengthCm: 220,
      widthCm: 180,
      heightCm: 110,
      weightGrams: 80000,
      sortOrder: 10,
      variants: [
        {
          sku: "KRV-FJR-160",
          label: "160 × 200 см",
          options: [{ name: "Размер", value: "160 × 200 см" }],
          stockQuantity: 2,
        },
        {
          sku: "KRV-FJR-180",
          label: "180 × 200 см",
          options: [{ name: "Размер", value: "180 × 200 см" }],
          priceCopecks: 8490000n,
          stockQuantity: 1,
        },
      ],
    },
  ];

  for (const p of productData) {
    const { variants, ...productRow } = p;
    await db.insert(products).values(productRow).onConflictDoNothing();

    // Most fixture products use the placeholder. KHM Demo 01 below has two
    // intentionally marked demo images to exercise the gallery path.

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      await db
        .insert(productVariants)
        .values({
          id: `${p.id.slice(0, -1)}${(i + 1).toString(16)}`,
          productId: p.id,
          sku: v.sku,
          label: v.label,
          options: v.options,
          priceCopecks: v.priceCopecks ?? null,
          stockQuantity: v.stockQuantity,
          isActive: true,
        })
        .onConflictDoNothing();
    }
  }

  // -------------------------------------------------------------------------
  // KHM Demo 01 — canonical vertical-slice fixture.
  // All characteristics, prices, images and availability are test data.
  // -------------------------------------------------------------------------
  const demoProductId = "22222222-0000-0000-0000-000000000005";
  await db
    .insert(products)
    .values({
      id: demoProductId,
      slug: "khm-demo-01",
      name: "Обеденный стол KHM Demo 01",
      description:
        "Тестовая модель для проверки конфигуратора, точной цены и складских остатков. Не является производственным ассортиментом.",
      body: `<p>Это демонстрационная карточка для dev-среды. Реальные материалы, размеры, цены и фотографии будут внесены перед production.</p>`,
      categoryId: CAT_TABLES,
      basePriceCopecks: 12900000n,
      lengthCm: 160,
      widthCm: 80,
      heightCm: 75,
      weightGrams: 42000,
      metaTitle: "Обеденный стол KHM Demo 01 — тестовая витрина",
      metaDescription:
        "Тестовая карточка обеденного стола для проверки конфигураций и наличия.",
      sortOrder: 0,
      attributes: [
        { name: "Статус", value: "Тестовая модель" },
        { name: "Высота", value: "750 мм" },
        { name: "География demo", value: "Уфа" },
      ],
      isActive: true,
    })
    .onConflictDoNothing();

  await db
    .insert(productVariants)
    .values([
      {
        id: "66666666-0000-0000-0000-000000000001",
        productId: demoProductId,
        sku: "DEMO-KHM01-160-NAT",
        label: "1600×800 / дубовый шпон / Natural Oak / матовый лак",
        options: [
          { name: "Размер", value: "1600×800 мм" },
          { name: "Материал", value: "Дубовый шпон" },
          { name: "Оттенок", value: "Natural Oak" },
          { name: "Отделка", value: "Матовый лак" },
        ],
        stockQuantity: 2,
        isActive: true,
      },
      {
        id: "66666666-0000-0000-0000-000000000002",
        productId: demoProductId,
        sku: "DEMO-KHM01-160-WAL",
        label: "1600×800 / дубовый шпон / Walnut / матовый лак",
        options: [
          { name: "Размер", value: "1600×800 мм" },
          { name: "Материал", value: "Дубовый шпон" },
          { name: "Оттенок", value: "Walnut" },
          { name: "Отделка", value: "Матовый лак" },
        ],
        priceCopecks: 13400000n,
        stockQuantity: 1,
        isActive: true,
      },
      {
        id: "66666666-0000-0000-0000-000000000003",
        productId: demoProductId,
        sku: "DEMO-KHM01-180-NAT",
        label: "1800×900 / дубовый шпон / Natural Oak / матовый лак",
        options: [
          { name: "Размер", value: "1800×900 мм" },
          { name: "Материал", value: "Дубовый шпон" },
          { name: "Оттенок", value: "Natural Oak" },
          { name: "Отделка", value: "Матовый лак" },
        ],
        priceCopecks: 14900000n,
        stockQuantity: 2,
        isActive: true,
      },
      {
        id: "66666666-0000-0000-0000-000000000004",
        productId: demoProductId,
        sku: "DEMO-KHM01-180-SOLID",
        label: "1800×900 / массив дуба / Natural Oak / масло",
        options: [
          { name: "Размер", value: "1800×900 мм" },
          { name: "Материал", value: "Массив дуба" },
          { name: "Оттенок", value: "Natural Oak" },
          { name: "Отделка", value: "Масло" },
        ],
        priceCopecks: 17900000n,
        stockQuantity: 1,
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(productImages)
    .values([
      {
        id: "77777777-0000-0000-0000-000000000001",
        productId: demoProductId,
        s3Key: "demo/hero-table.png",
        altText: "Тестовая интерьерная фотография обеденного стола KHM Demo 01",
        sortOrder: 0,
      },
      {
        id: "77777777-0000-0000-0000-000000000002",
        productId: demoProductId,
        s3Key: "demo/oak-joint-detail.png",
        altText: "Тестовая макрофотография соединения стола KHM Demo 01",
        sortOrder: 1,
      },
    ])
    .onConflictDoNothing();

  // -------------------------------------------------------------------------
  // Source catalog fixtures — data transcribed from cards supplied on 18.09.
  // Availability is deliberately DEV-only: it is not a claim about stock.
  // -------------------------------------------------------------------------
  const sourceCatalogProducts = [
    {
      id: "22222222-0000-0000-0000-000000000006",
      skuPrefix: "DEV-TV-2000",
      slug: "tv-tumba-2000",
      name: "ТВ-тумба 2000",
      categoryId: CAT_STORAGE,
      description:
        "Подвесная ТВ-тумба длиной 2000 мм с тремя ящиками. Выполнена из дубового шпона.",
      body: `<p>Подвесная ТВ-тумба для лаконичной гостиной. Три ящика помогают убрать технику и мелочи из поля зрения.</p><p>В тестовой витрине представлены три варианта отделки: натуральный, орех и чёрный.</p>`,
      basePriceCopecks: 6500000n,
      lengthCm: 200,
      widthCm: 40,
      heightCm: 26,
      weightGrams: 0,
      metaTitle: "Подвесная ТВ-тумба 2000 из дубового шпона",
      metaDescription:
        "ТВ-тумба 2000: дубовый шпон, 3 ящика, подвесная конструкция. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/tv-console-2000.jpg",
      altText: "Подвесная ТВ-тумба 2000 из дубового шпона с тремя ящиками",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "2000 × 400 × 260 мм" },
        { name: "Конструкция", value: "Подвесная, без ножек" },
        { name: "Ящики", value: "3" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000007",
      skuPrefix: "DEV-TV-1200",
      slug: "tv-tumba-1200",
      name: "ТВ-тумба 1200",
      categoryId: CAT_STORAGE,
      description:
        "Подвесная ТВ-тумба длиной 1200 мм с двумя ящиками из дубового шпона.",
      body: `<p>Компактная подвесная ТВ-тумба с двумя ящиками. Подходит для небольших гостиных и медиа-зон.</p><p>В тестовой витрине доступны отделки «Натуральный», «Орех» и «Чёрный».</p>`,
      basePriceCopecks: 5500000n,
      lengthCm: 120,
      widthCm: 40,
      heightCm: 26,
      weightGrams: 0,
      metaTitle: "Подвесная ТВ-тумба 1200 из дубового шпона",
      metaDescription:
        "ТВ-тумба 1200: дубовый шпон, 2 ящика, подвесная конструкция. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/tv-console-1200.jpg",
      altText: "Подвесная ТВ-тумба 1200 из дубового шпона с двумя ящиками",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1200 × 400 × 260 мм" },
        { name: "Конструкция", value: "Подвесная, без ножек" },
        { name: "Ящики", value: "2" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000008",
      skuPrefix: "DEV-DRS-1600",
      slug: "komod-1600",
      name: "Комод 1600",
      categoryId: CAT_STORAGE,
      description:
        "Комод длиной 1600 мм с восемью ящиками: дубовый шпон и ножки из массива дуба.",
      body: `<p>Вместительный комод с восемью ящиками. Корпус выполнен из дубового шпона, ножки — из массива дуба.</p><p>Тестовые варианты отделки: натуральный, орех и чёрный.</p>`,
      basePriceCopecks: 8900000n,
      lengthCm: 160,
      widthCm: 45,
      heightCm: 90,
      weightGrams: 0,
      metaTitle: "Комод 1600 с восемью ящиками из дубового шпона",
      metaDescription:
        "Комод 1600: 8 ящиков, дубовый шпон и ножки из массива дуба. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/dresser-1600.jpg",
      altText: "Комод 1600 из дубового шпона с восемью ящиками на ножках из массива дуба",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1600 × 450 × 900 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Ящики", value: "8" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000009",
      skuPrefix: "DEV-TBL-ROUND-1000",
      slug: "stol-kruglyi-1000",
      name: "Стол круглый 1000",
      categoryId: CAT_TABLES,
      description:
        "Круглый стол диаметром 1000 мм из дубового шпона на ножках из массива дуба.",
      body: `<p>Круглый стол диаметром 1000 мм. Столешница выполнена из дубового шпона, ножки — из массива дуба.</p><p>Карточка сохранена в dev-базе, но не опубликована: для витрины нужен подходящий рендер без крупной текстовой плашки.</p>`,
      basePriceCopecks: 4600000n,
      lengthCm: 100,
      widthCm: 100,
      heightCm: 75,
      weightGrams: 0,
      metaTitle: "Круглый стол 1000 из дубового шпона",
      metaDescription:
        "Круглый стол 1000: дубовый шпон и ножки из массива дуба. Черновая карточка KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/round-table-1000.jpg",
      altText: "Круглый стол 1000 из дубового шпона на ножках из массива дуба",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1000 × 1000 × 750 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000010",
      skuPrefix: "DEV-COFFEE-350",
      slug: "stol-kofeynyi-350",
      name: "Стол кофейный 350",
      categoryId: CAT_TABLES,
      description:
        "Компактный кофейный стол 350 мм из дубового шпона с ножками из массива дуба.",
      body: `<p>Небольшой кофейный стол для кресла или дивана. Съёмная столешница на магнитах может использоваться как поднос.</p><p>В тестовой витрине показаны натуральный, ореховый и чёрный варианты отделки.</p>`,
      basePriceCopecks: 2600000n,
      lengthCm: 35,
      widthCm: 35,
      heightCm: 60,
      weightGrams: 0,
      metaTitle: "Кофейный стол 350 из дубового шпона",
      metaDescription:
        "Кофейный стол 350: дубовый шпон, ножки из массива дуба, съёмная столешница-поднос. Тестовая витрина.",
      imageKey: "catalog/source-2026-09-18/coffee-table-350.jpg",
      altText: "Кофейный стол 350 из дубового шпона на ножках из массива дуба",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "350 × 350 × 600 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Ящики", value: "0" },
        { name: "Особенность", value: "Столешница на магнитах может использоваться как поднос" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000011",
      skuPrefix: "DEV-DINE-4LEG-1800",
      slug: "stol-kuhonnyi-1800-4-opory",
      name: "Стол кухонный 1800 — 4 опоры",
      categoryId: CAT_TABLES,
      description:
        "Кухонный стол 1800 мм в минималистичной геометрии: дубовый шпон и четыре ножки из массива дуба.",
      body: `<p>Кухонный стол на четырёх опорах для обеденной зоны. Столешница выполнена из дубового шпона, ножки — из массива дуба.</p><p>В тестовой витрине доступны три варианта отделки: натуральный, орех и чёрный.</p>`,
      basePriceCopecks: 7600000n,
      lengthCm: 180,
      widthCm: 80,
      heightCm: 75,
      weightGrams: 0,
      metaTitle: "Кухонный стол 1800 на четырёх опорах",
      metaDescription:
        "Кухонный стол 1800 × 800 мм: дубовый шпон, четыре ножки из массива дуба. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/dining-table-four-legs-1800.jpg",
      altText: "Кухонный стол 1800 из дубового шпона на четырёх ножках из массива дуба",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1800 × 800 × 750 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Ящики", value: "0" },
        { name: "Стиль", value: "Минимализм" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000012",
      skuPrefix: "DEV-DINE-SPLAY-1800",
      slug: "stol-kuhonnyi-1800-naklonnye-opory",
      name: "Стол кухонный 1800 — наклонные опоры",
      categoryId: CAT_TABLES,
      description:
        "Кухонный стол 1800 мм с наклонными опорами: дубовый шпон и ножки из массива дуба.",
      body: `<p>Кухонный стол с выразительной геометрией наклонных опор. Столешница выполнена из дубового шпона, ножки — из массива дуба.</p><p>Тестовые варианты отделки: натуральный, орех и чёрный.</p>`,
      basePriceCopecks: 8200000n,
      lengthCm: 180,
      widthCm: 80,
      heightCm: 75,
      weightGrams: 0,
      metaTitle: "Кухонный стол 1800 с наклонными опорами",
      metaDescription:
        "Кухонный стол 1800 × 800 мм: дубовый шпон и наклонные ножки из массива дуба. Тестовая витрина.",
      imageKey: "catalog/source-2026-09-18/dining-table-splayed-legs-1800.jpg",
      altText: "Кухонный стол 1800 из дубового шпона на наклонных ножках из массива дуба",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1800 × 800 × 750 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Ящики", value: "0" },
        { name: "Стиль", value: "Минимализм" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000013",
      skuPrefix: "DEV-DINE-PEDESTAL-1800",
      slug: "stol-kuhonnyi-1800-opory",
      name: "Стол кухонный 1800 — две опоры",
      categoryId: CAT_TABLES,
      description:
        "Кухонный стол 1800 мм на двух опорах из дубового шпона и массива дуба.",
      body: `<p>Кухонный стол на двух опорах для выразительной обеденной зоны. Столешница выполнена из дубового шпона, ножки — из массива дуба.</p><p>В dev-каталоге доступны тестовые варианты: натуральный, орех и чёрный.</p>`,
      basePriceCopecks: 9600000n,
      lengthCm: 180,
      widthCm: 80,
      heightCm: 75,
      weightGrams: 0,
      metaTitle: "Кухонный стол 1800 на двух опорах",
      metaDescription:
        "Кухонный стол 1800 × 800 мм: дубовый шпон, две опоры из массива дуба. Тестовая витрина.",
      imageKey: "catalog/source-2026-09-18/dining-table-pedestal-1800.jpg",
      altText: "Кухонный стол 1800 из дубового шпона на двух опорах",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1800 × 800 × 750 мм" },
        { name: "Ножки", value: "Массив дуба" },
        { name: "Ящики", value: "0" },
        { name: "Стиль", value: "Минимализм" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000014",
      skuPrefix: "DEV-COFFEE-1000",
      slug: "stol-zhurnalnyi-1000",
      name: "Стол журнальный 1000",
      categoryId: CAT_TABLES,
      description:
        "Журнальный стол 1000 мм из дубового шпона в минималистичной геометрии.",
      body: `<p>Журнальный стол для гостиной. Столешница и ножки выполнены из дубового шпона; конструкция не предусматривает ящики.</p><p>В тестовой витрине представлены натуральный, ореховый и чёрный варианты отделки.</p>`,
      basePriceCopecks: 3600000n,
      lengthCm: 100,
      widthCm: 50,
      heightCm: 60,
      weightGrams: 0,
      metaTitle: "Журнальный стол 1000 из дубового шпона",
      metaDescription:
        "Журнальный стол 1000 × 500 мм из дубового шпона. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/coffee-table-1000.jpg",
      altText: "Журнальный стол 1000 из дубового шпона",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "1000 × 500 × 600 мм" },
        { name: "Ножки", value: "Шпон дуба" },
        { name: "Ящики", value: "0" },
        { name: "Стиль", value: "Минимализм" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000015",
      skuPrefix: "DEV-DESK-2200",
      slug: "stol-direktora-2200",
      name: "Стол директора 2200",
      categoryId: CAT_TABLES,
      description:
        "Стол директора длиной 2200 мм: дубовый шпон, три ящика и классическая геометрия.",
      body: `<p>Просторный рабочий стол для кабинета. Корпус и ножки выполнены из дубового шпона, предусмотрены три ящика.</p><p>В тестовой витрине представлены натуральный, ореховый и чёрный варианты отделки.</p>`,
      basePriceCopecks: 18300000n,
      lengthCm: 220,
      widthCm: 70,
      heightCm: 75,
      weightGrams: 0,
      metaTitle: "Стол директора 2200 из дубового шпона",
      metaDescription:
        "Стол директора 2200: дубовый шпон, 3 ящика, классический вид. Тестовая витрина KHAMATNUROV MEBEL.",
      imageKey: "catalog/source-2026-09-18/executive-desk-2200.jpg",
      altText: "Стол директора 2200 из дубового шпона с тремя ящиками",
      attributes: [
        { name: "Материал", value: "Шпон дуба" },
        { name: "Габариты (Ш × Г × В)", value: "2200 × 700 × 750 мм" },
        { name: "Ножки", value: "Шпон дуба" },
        { name: "Ящики", value: "3" },
        { name: "Стиль", value: "Классический" },
        { name: "Статус каталога", value: "Тестовая доступность" },
      ],
    },
  ];

  const sourceColors = ["Натуральный", "Орех", "Чёрный"];
  for (const [productIndex, sourceProduct] of sourceCatalogProducts.entries()) {
    const { skuPrefix, imageKey, altText, ...productRow } = sourceProduct;
    await db
      .insert(products)
      .values({ ...productRow, isActive: true })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          ...productRow,
          isActive: true,
          isArchived: false,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(productImages)
      .values({
        id: `88888888-0000-0000-0000-${(productIndex + 1).toString().padStart(12, "0")}`,
        productId: sourceProduct.id,
        s3Key: imageKey,
        altText,
        sortOrder: 0,
      })
      .onConflictDoNothing();

    await db
      .insert(productVariants)
      .values(
        sourceColors.map((color, colorIndex) => ({
          id: `99999999-0000-0000-0000-${(productIndex * 3 + colorIndex + 1)
            .toString()
            .padStart(12, "0")}`,
          productId: sourceProduct.id,
          sku: `${skuPrefix}-${colorIndex + 1}`,
          label: color,
          options: [{ name: "Цвет", value: color }],
          stockQuantity: 1,
          isActive: true,
        }))
      )
      .onConflictDoNothing();
  }

  // The supplied preview for the round table contains a very small embedded
  // render and a dominant text block. Keep its parsed data in the inventory,
  // but hide this dev card until a suitable product image is provided.
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, "22222222-0000-0000-0000-000000000009"));

  console.log("✓ Products, variants, and images seeded");

  // -------------------------------------------------------------------------
  // CMS — static pages (legal/info) + blog posts
  // -------------------------------------------------------------------------
  const PAGE_NS = "33333333-0000-0000-0000-0000000000";
  const staticPages = [
    {
      id: `${PAGE_NS}01`,
      slug: "delivery",
      title: "Доставка и оплата",
      metaTitle: "Доставка и оплата — KHAMATNUROV MEBEL",
      metaDescription: "Тестовые условия доставки и оплаты в Уфе.",
      body: `<p>Это test/demo-страница, не коммерческое предложение.</p>
<h2>Доставка</h2><p>В dev-сценарии доставка в черте Уфы стоит 2 500 ₽. Реальные тарифы будут внесены перед production.</p>
<h2>Оплата</h2><p>Для проверки потока используется sandbox ЮKassa. Будущая схема оплаты пока не утверждена.</p>`,
    },
    {
      id: `${PAGE_NS}02`,
      slug: "returns",
      title: "Возврат и обмен",
      metaTitle: "Возврат и обмен — KHAMATNUROV MEBEL",
      metaDescription: "Порядок возврата и обмена мебели надлежащего и ненадлежащего качества.",
      body: `<p>Тестовая страница. Условия возврата и обмена не утверждены и будут подготовлены перед production.</p>`,
    },
    {
      id: `${PAGE_NS}03`,
      slug: "about",
      title: "О компании",
      metaTitle: "О компании — KHAMATNUROV MEBEL",
      metaDescription: "Тестовая витрина KHAMATNUROV MEBEL.",
      body: `<p>KHAMATNUROV MEBEL — test/demo-витрина будущего интернет-магазина предметной мебели из Уфы.</p><p>Биография мастерской и факты о производстве будут добавлены после получения реальных данных.</p>`,
    },
    {
      id: `${PAGE_NS}04`,
      slug: "contacts",
      title: "Контакты",
      metaTitle: "Контакты — KHAMATNUROV MEBEL",
      metaDescription: "Тестовая страница контактов KHAMATNUROV MEBEL.",
      body: `<p>Тестовая страница: телефон, email и адрес мастерской в Уфе появятся после получения реальных данных.</p>`,
    },
    {
      id: `${PAGE_NS}05`,
      slug: "offer",
      title: "Публичная оферта",
      metaTitle: "Публичная оферта — KHAMATNUROV MEBEL",
      metaDescription: "Условия публичной оферты интернет-магазина KHAMATNUROV MEBEL.",
      body: `<p>Тестовая заглушка. Этот текст не является публичной офертой. Документ будет подготовлен после выбора юрлица, схемы оплаты и доставки.</p>`,
    },
    {
      id: `${PAGE_NS}06`,
      slug: "privacy",
      title: "Политика конфиденциальности",
      metaTitle: "Политика конфиденциальности — KHAMATNUROV MEBEL",
      metaDescription: "Как мы обрабатываем и защищаем персональные данные (152-ФЗ).",
      body: `<p>Тестовая заглушка для будущей политики конфиденциальности. До production её нужно заменить документом, проверенным юристом.</p>`,
    },
  ];

  for (const page of staticPages) {
    await db
      .insert(pages)
      .values({ ...page, isPublished: true })
      .onConflictDoUpdate({
        target: pages.id,
        set: {
          slug: page.slug,
          title: page.title,
          body: page.body,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isPublished: true,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ ${staticPages.length} static pages seeded`);

  const POST_NS = "44444444-0000-0000-0000-0000000000";
  const posts = [
    {
      id: `${POST_NS}01`,
      slug: "kak-vybrat-divan",
      title: "Как выбрать диван для гостиной",
      excerpt:
        "Размеры, механизмы трансформации, обивка и наполнитель — разбираемся, на что смотреть при выборе дивана.",
      body: `<p>Диван — центр гостиной. Прежде чем покупать, измерьте комнату и определите назначение: для сна, отдыха или приёма гостей.</p>
<h2>Механизм трансформации</h2><p>«Еврокнижка» и «аккордеон» подойдут для ежедневного сна, «дельфин» — для нечастого использования.</p>
<h2>Обивка</h2><p>Рогожка практична и износостойка, велюр приятен на ощупь, но требует ухода.</p>`,
    },
    {
      id: `${POST_NS}02`,
      slug: "uhod-za-massivom",
      title: "Уход за мебелью из массива дерева",
      excerpt:
        "Простые правила, которые продлят жизнь деревянной мебели на десятилетия.",
      body: `<p>Массив дерева служит десятилетиями при правильном уходе. Держите мебель вдали от батарей и прямых солнечных лучей.</p>
<h2>Влажность</h2><p>Оптимальная влажность в помещении — 45–60%. Слишком сухой воздух приводит к появлению трещин.</p>
<h2>Уборка</h2><p>Протирайте поверхность мягкой сухой или слегка влажной тканью без агрессивной химии.</p>`,
    },
    {
      id: `${POST_NS}03`,
      slug: "trendy-interiera-2026",
      title: "Тренды интерьера 2026 года",
      excerpt: "Натуральные материалы, тёплые оттенки и мультифункциональная мебель.",
      body: `<p>В 2026 году в моде естественность: натуральное дерево, лён, тёплая бежевая и терракотовая палитра.</p>
<h2>Мультифункциональность</h2><p>Компактные квартиры диктуют спрос на трансформируемую мебель и системы хранения.</p>`,
    },
  ];

  for (const post of posts) {
    await db
      .insert(blogPosts)
      .values({
        ...post,
        coverImageKey: "",
        isPublished: true,
        publishedAt: new Date(),
      })
      .onConflictDoNothing();
  }
  console.log(`✓ ${posts.length} blog posts seeded`);

  // -------------------------------------------------------------------------
  // Shipping — zones, tariff brackets, volumetric divisor
  // -------------------------------------------------------------------------
  const ZONE_UFA_CITY = "55555555-0000-0000-0000-000000000001";
  const ZONE_UFA_OUTER = "55555555-0000-0000-0000-000000000002";
  const ZONE_UFA_PICKUP = "55555555-0000-0000-0000-000000000003";

  await db
    .insert(shippingZones)
    .values([
      { id: ZONE_UFA_CITY, name: "Уфа — в черте города (demo)", sortOrder: 10, isActive: true },
      { id: ZONE_UFA_OUTER, name: "Уфа — пригород (demo)", sortOrder: 20, isActive: true },
      { id: ZONE_UFA_PICKUP, name: "Самовывоз из Уфы (demo)", sortOrder: 30, isActive: true },
    ])
    .onConflictDoUpdate({
      target: shippingZones.id,
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order`, isActive: true },
    });

  // [zoneId, idSuffix, maxWeightKg, priceCopecks, extraPerKgCopecks]
  // Keep all historical fixture IDs up to date as well: a re-seed must not
  // leave older geographic brackets available in an existing dev database.
  const tariffRows: Array<[string, string, number, bigint, bigint]> = [
    [ZONE_UFA_CITY, "11", 10, 250000n, 0n],
    [ZONE_UFA_CITY, "12", 30, 250000n, 0n],
    [ZONE_UFA_CITY, "13", 9999, 250000n, 0n],
    [ZONE_UFA_OUTER, "21", 10, 350000n, 0n],
    [ZONE_UFA_OUTER, "22", 30, 350000n, 0n],
    [ZONE_UFA_OUTER, "23", 9999, 350000n, 0n],
    [ZONE_UFA_PICKUP, "31", 10, 0n, 0n],
    [ZONE_UFA_PICKUP, "32", 30, 0n, 0n],
    [ZONE_UFA_PICKUP, "33", 9999, 0n, 0n],
  ];
  await db
    .insert(shippingTariffs)
    .values(
      tariffRows.map(([zoneId, sfx, maxWeightKg, priceCopecks, extraPerKgCopecks]) => ({
        id: `55555555-0000-0000-0000-0000000001${sfx}`,
        zoneId,
        maxWeightKg,
        priceCopecks,
        extraPerKgCopecks,
        isActive: true,
      }))
    )
    .onConflictDoUpdate({
      target: shippingTariffs.id,
      set: {
        zoneId: sql`excluded.zone_id`,
        maxWeightKg: sql`excluded.max_weight_kg`,
        priceCopecks: sql`excluded.price_copecks`,
        extraPerKgCopecks: sql`excluded.extra_per_kg_copecks`,
        isActive: true,
      },
    });

  await db
    .insert(shippingSettings)
    .values({
      id: "55555555-0000-0000-0000-0000000000ff",
      key: "volumetric_divisor",
      value: "5000",
    })
    .onConflictDoNothing();

  console.log("✓ Shipping zones, tariffs, divisor seeded");

  // Seed bypasses admin actions, so it must explicitly invalidate the cached
  // public lists. Otherwise a running dev server can show an older catalog
  // until the five-minute TTL expires.
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      await redis.connect();
      await redis.del(
        "products:category:divany",
        "products:category:kresla",
        "products:category:stoly",
        "products:category:krovati",
        "products:category:hranenie",
        "products:all",
        "categories:all",
        ...sourceCatalogProducts.map((product) => `product:${product.slug}`)
      );
      await redis.quit();
      console.log("✓ Catalog cache invalidated");
    }
  } catch (err) {
    console.warn("⚠ Catalog cache was not invalidated:", err);
  }

  console.log("✅ Done");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
  await closeDb();
  process.exit(0);
});

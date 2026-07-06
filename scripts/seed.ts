/**
 * Seed script — populates the DB with demo categories, products, and variants.
 * Usage: npm run db:seed
 *
 * Idempotent: re-running will not duplicate records (uses fixed UUIDs).
 */
import { config } from "dotenv";
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
  pages,
  blogPosts,
  shippingZones,
  shippingTariffs,
  shippingSettings,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("@/lib/db/schema") as typeof import("@/lib/db/schema");

// Stable UUIDs so re-runs are idempotent (we use ON CONFLICT DO NOTHING)
const CAT_SOFAS = "11111111-0000-0000-0000-000000000001";
const CAT_ARMCHAIRS = "11111111-0000-0000-0000-000000000002";
const CAT_TABLES = "11111111-0000-0000-0000-000000000003";
const CAT_BEDS = "11111111-0000-0000-0000-000000000004";

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
          "Купите диван ручной работы. Натуральные материалы, авторский дизайн, доставка по Москве и области.",
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

    // No images are seeded — the storefront falls back to placeholder.svg when
    // a product has zero images (see ProductGallery). Real photos are uploaded
    // via the admin panel.

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
      metaDescription: "Условия доставки мебели по Москве и области, способы оплаты.",
      body: `<p>Доставляем мебель по Москве и Московской области. Сроки и стоимость зависят от габаритов заказа и адреса.</p>
<h2>Сроки</h2>
<ul><li>Москва в пределах МКАД — 2–4 рабочих дня</li><li>Московская область — 3–7 рабочих дней</li></ul>
<h2>Оплата</h2>
<p>Оплата онлайн банковской картой через защищённый сервис ЮKassa. После оплаты с вами свяжется менеджер для согласования времени доставки.</p>`,
    },
    {
      id: `${PAGE_NS}02`,
      slug: "returns",
      title: "Возврат и обмен",
      metaTitle: "Возврат и обмен — KHAMATNUROV MEBEL",
      metaDescription: "Порядок возврата и обмена мебели надлежащего и ненадлежащего качества.",
      body: `<p>Вы можете вернуть товар надлежащего качества в течение 7 дней с момента получения, если он не был в употреблении и сохранён товарный вид.</p>
<h2>Как оформить возврат</h2>
<ol><li>Свяжитесь с нами по телефону или email</li><li>Опишите причину возврата</li><li>Согласуйте дату вывоза</li></ol>
<p>Мебель, изготовленная по индивидуальному заказу, возврату и обмену не подлежит.</p>`,
    },
    {
      id: `${PAGE_NS}03`,
      slug: "about",
      title: "О компании",
      metaTitle: "О компании — KHAMATNUROV MEBEL",
      metaDescription: "KHAMATNUROV MEBEL: серийная мебель ручной работы из массива.",
      body: `<p>«KHAMATNUROV MEBEL» — это серийная мебель ручной работы из массива дерева и качественных тканей.</p>
<p>Мы работаем с 2015 года и сделали уютнее уже более 5000 домов. Каждое изделие проходит контроль качества перед отправкой.</p>`,
    },
    {
      id: `${PAGE_NS}04`,
      slug: "contacts",
      title: "Контакты",
      metaTitle: "Контакты — KHAMATNUROV MEBEL",
      metaDescription: "Телефон, email и адрес шоурума Мебельной мастерской.",
      body: `<p>Телефон: <a href="tel:+74950000000">+7 (495) 000-00-00</a></p>
<p>Email: <a href="mailto:info@example.com">info@example.com</a></p>
<p>Шоурум: Москва, ул. Примерная, д. 1. Ежедневно с 10:00 до 21:00.</p>`,
    },
    {
      id: `${PAGE_NS}05`,
      slug: "offer",
      title: "Публичная оферта",
      metaTitle: "Публичная оферта — KHAMATNUROV MEBEL",
      metaDescription: "Условия публичной оферты интернет-магазина KHAMATNUROV MEBEL.",
      body: `<p>Настоящий документ является публичной офертой и определяет условия продажи товаров через интернет-магазин.</p>
<h2>1. Общие положения</h2><p>Оформляя заказ, покупатель принимает условия настоящей оферты в полном объёме.</p>
<h2>2. Предмет</h2><p>Продавец обязуется передать товар, а покупатель — принять и оплатить его.</p>`,
    },
    {
      id: `${PAGE_NS}06`,
      slug: "privacy",
      title: "Политика конфиденциальности",
      metaTitle: "Политика конфиденциальности — KHAMATNUROV MEBEL",
      metaDescription: "Как мы обрабатываем и защищаем персональные данные (152-ФЗ).",
      body: `<p>Мы обрабатываем персональные данные в соответствии с Федеральным законом №152-ФЗ «О персональных данных».</p>
<h2>Какие данные мы собираем</h2><ul><li>имя и контактные данные</li><li>адрес доставки</li><li>историю заказов</li></ul>
<p>Данные используются исключительно для обработки заказов и не передаются третьим лицам, кроме служб доставки и платёжных систем.</p>`,
    },
  ];

  for (const page of staticPages) {
    await db
      .insert(pages)
      .values({ ...page, isPublished: true })
      .onConflictDoNothing();
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
  const ZONE_MSK = "55555555-0000-0000-0000-000000000001";
  const ZONE_MO50 = "55555555-0000-0000-0000-000000000002";
  const ZONE_MO100 = "55555555-0000-0000-0000-000000000003";

  await db
    .insert(shippingZones)
    .values([
      { id: ZONE_MSK, name: "Москва (в пределах МКАД)", sortOrder: 10, isActive: true },
      { id: ZONE_MO50, name: "Московская область до 50 км", sortOrder: 20, isActive: true },
      { id: ZONE_MO100, name: "Московская область 50–100 км", sortOrder: 30, isActive: true },
    ])
    .onConflictDoNothing();

  // [zoneId, idSuffix, maxWeightKg, priceCopecks, extraPerKgCopecks]
  const tariffRows: Array<[string, string, number, bigint, bigint]> = [
    [ZONE_MSK, "11", 10, 50000n, 0n],
    [ZONE_MSK, "12", 30, 90000n, 0n],
    [ZONE_MSK, "13", 80, 150000n, 2000n],
    [ZONE_MO50, "21", 10, 90000n, 0n],
    [ZONE_MO50, "22", 30, 150000n, 0n],
    [ZONE_MO50, "23", 80, 250000n, 3000n],
    [ZONE_MO100, "31", 10, 150000n, 0n],
    [ZONE_MO100, "32", 30, 250000n, 0n],
    [ZONE_MO100, "33", 80, 400000n, 4000n],
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
    .onConflictDoNothing();

  await db
    .insert(shippingSettings)
    .values({
      id: "55555555-0000-0000-0000-0000000000ff",
      key: "volumetric_divisor",
      value: "5000",
    })
    .onConflictDoNothing();

  console.log("✓ Shipping zones, tariffs, divisor seeded");

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
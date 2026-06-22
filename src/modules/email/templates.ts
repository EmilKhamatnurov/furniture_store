import { formatRub } from "@/lib/utils/money";
import { createOrderAccessToken } from "@/modules/orders/access";
import type { Order, OrderItem, ShippingAddress } from "@/modules/orders/db/schema";

// ---------------------------------------------------------------------------
// Email templates — pure functions, no I/O.
// Each returns { subject, html, text } ready to enqueue/send.
// Rendered server-side where order data is available, so the worker stays dumb.
// ---------------------------------------------------------------------------

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

type OrderWithItems = Order & { items: OrderItem[] };

const APP_URL = (process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

const BRAND = "KHAMATNUROV MEBEL";

// ---------------------------------------------------------------------------
// Shared layout — minimal, table-based for email-client compatibility
// ---------------------------------------------------------------------------
function layout(opts: { heading: string; body: string; preheader?: string }): string {
  const { heading, body, preheader = "" } = opts;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ec;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1b18;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ec;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e2d8;">
      <tr><td style="padding:28px 32px 12px;border-bottom:1px solid #efece4;">
        <span style="font-size:18px;font-weight:700;letter-spacing:.5px;">${BRAND}</span>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">${escapeHtml(heading)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #efece4;color:#8a857a;font-size:12px;line-height:18px;">
        Это письмо отправлено автоматически. Если у вас есть вопросы — просто ответьте на него.<br>
        © ${new Date().getFullYear()} ${BRAND}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function itemsTableHtml(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) => `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #efece4;">
    <div style="font-size:14px;font-weight:600;">${escapeHtml(i.productName)}</div>
    <div style="font-size:12px;color:#8a857a;">${escapeHtml(i.variantLabel)} · ${i.quantity} шт</div>
  </td>
  <td align="right" style="padding:8px 0;border-bottom:1px solid #efece4;font-size:14px;font-weight:600;white-space:nowrap;">
    ${formatRub(i.totalPriceCopecks)}
  </td>
</tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows}</table>`;
}

function addressLine(addr: ShippingAddress): string {
  return [
    addr.postalCode,
    addr.region,
    addr.city,
    addr.street,
    addr.apartment ? `кв. ${addr.apartment}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function itemsTextLines(items: OrderItem[]): string {
  return items
    .map((i) => `  • ${i.productName} (${i.variantLabel}) ×${i.quantity} — ${formatRub(i.totalPriceCopecks)}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// 1. Order created — sent right after checkout (status draft / pending_payment)
// ---------------------------------------------------------------------------
export function renderOrderConfirmation(order: OrderWithItems): RenderedEmail {
  const orderUrl = `${APP_URL}/orders/${order.id}?t=${createOrderAccessToken(order.id)}`;
  const subject = `Заказ ${order.number} принят`;

  const html = layout({
    heading: "Спасибо за заказ!",
    preheader: `Заказ ${order.number} принят и ожидает оплаты`,
    body: `
<p style="margin:0 0 16px;font-size:14px;line-height:22px;">
  Мы получили ваш заказ <strong>${escapeHtml(order.number)}</strong>. Ниже его состав.
</p>
${itemsTableHtml(order.items)}
<table role="presentation" width="100%" style="margin:4px 0 20px;">
  <tr><td style="font-size:16px;font-weight:700;">Итого</td>
      <td align="right" style="font-size:16px;font-weight:700;">${formatRub(order.totalCopecks)}</td></tr>
</table>
<p style="margin:0 0 20px;font-size:14px;line-height:22px;">
  Адрес доставки: ${escapeHtml(addressLine(order.shippingAddress))}
</p>
<a href="${orderUrl}" style="display:inline-block;background:#1c1b18;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
  Перейти к оплате
</a>`,
  });

  const text = `Спасибо за заказ!

Заказ ${order.number} принят.

Состав:
${itemsTextLines(order.items)}

Итого: ${formatRub(order.totalCopecks)}
Адрес: ${addressLine(order.shippingAddress)}

Оплата: ${orderUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 2. Payment received — sent when order transitions to paid
// ---------------------------------------------------------------------------
export function renderPaymentReceived(order: OrderWithItems): RenderedEmail {
  const orderUrl = `${APP_URL}/orders/${order.id}?t=${createOrderAccessToken(order.id)}`;
  const subject = `Оплата заказа ${order.number} получена`;

  const html = layout({
    heading: "Оплата получена ✓",
    preheader: `Платёж по заказу ${order.number} успешно проведён`,
    body: `
<p style="margin:0 0 16px;font-size:14px;line-height:22px;">
  Мы получили оплату по заказу <strong>${escapeHtml(order.number)}</strong> на сумму
  <strong>${formatRub(order.totalCopecks)}</strong>.
</p>
<p style="margin:0 0 20px;font-size:14px;line-height:22px;">
  Наш менеджер свяжется с вами для уточнения деталей доставки.
</p>
<a href="${orderUrl}" style="display:inline-block;background:#1c1b18;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
  Посмотреть заказ
</a>`,
  });

  const text = `Оплата получена!

Заказ ${order.number} оплачен на сумму ${formatRub(order.totalCopecks)}.
Наш менеджер свяжется с вами для уточнения деталей доставки.

Заказ: ${orderUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 3. Admin notification — new paid order needs processing
// ---------------------------------------------------------------------------
export function renderAdminNewOrder(order: OrderWithItems): RenderedEmail {
  const orderUrl = `${APP_URL}/orders/${order.id}?t=${createOrderAccessToken(order.id)}`;
  const addr = order.shippingAddress;
  const subject = `🛋 Новый оплаченный заказ ${order.number}`;

  const html = layout({
    heading: `Новый заказ ${order.number}`,
    preheader: `${formatRub(order.totalCopecks)} · ${addr.fullName}`,
    body: `
${itemsTableHtml(order.items)}
<table role="presentation" width="100%" style="margin:4px 0 20px;">
  <tr><td style="font-size:16px;font-weight:700;">Итого</td>
      <td align="right" style="font-size:16px;font-weight:700;">${formatRub(order.totalCopecks)}</td></tr>
</table>
<p style="margin:0 0 6px;font-size:14px;"><strong>Клиент:</strong> ${escapeHtml(addr.fullName)}</p>
<p style="margin:0 0 6px;font-size:14px;"><strong>Телефон:</strong> ${escapeHtml(addr.phone)}</p>
<p style="margin:0 0 6px;font-size:14px;"><strong>Email:</strong> ${escapeHtml(order.email)}</p>
<p style="margin:0 0 20px;font-size:14px;"><strong>Адрес:</strong> ${escapeHtml(addressLine(addr))}</p>
${order.customerNote ? `<p style="margin:0 0 20px;font-size:14px;"><strong>Комментарий:</strong> ${escapeHtml(order.customerNote)}</p>` : ""}
<a href="${orderUrl}" style="display:inline-block;background:#1c1b18;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
  Открыть заказ
</a>`,
  });

  const text = `Новый оплаченный заказ ${order.number}

Состав:
${itemsTextLines(order.items)}

Итого: ${formatRub(order.totalCopecks)}

Клиент: ${addr.fullName}
Телефон: ${addr.phone}
Email: ${order.email}
Адрес: ${addressLine(addr)}
${order.customerNote ? `Комментарий: ${order.customerNote}\n` : ""}
Заказ: ${orderUrl}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Minimal HTML escaping for interpolated user data
// ---------------------------------------------------------------------------
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

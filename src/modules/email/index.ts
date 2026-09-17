// Public API of the email module — server-side only.

export {
  sendOrderConfirmationEmail,
  sendOrderCreatedEmails,
  sendPaymentReceivedEmails,
} from "./service";
export { sendEmail } from "./client";
export type { SendEmailParams, SendEmailResult } from "./client";
export {
  renderOrderConfirmation,
  renderPaymentReceived,
  renderAdminNewOrder,
} from "./templates";
export type { RenderedEmail } from "./templates";

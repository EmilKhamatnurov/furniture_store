import "server-only";
import { verifyOrderAccessToken } from "@/modules/orders";
import { getCurrentCustomer } from "@/modules/customers";

// ---------------------------------------------------------------------------
// Order access authorization — shared by the confirmation page and the
// payment action. An order exposes PII (152-FZ), and initiating a payment
// must not be possible for strangers who guess an order id.
//
// Access is granted to either:
//  - the bearer of a valid capability token (?t= from checkout redirect/email)
//  - the logged-in owner (by customerId or by the checkout email)
// ---------------------------------------------------------------------------
export async function canAccessOrder(
  orderId: string,
  token: string | undefined | null,
  ownerCustomerId: string | null,
  ownerEmail: string
): Promise<boolean> {
  if (verifyOrderAccessToken(orderId, token)) return true;
  const customer = await getCurrentCustomer();
  if (!customer) return false;
  return (
    (ownerCustomerId !== null && ownerCustomerId === customer.id) ||
    ownerEmail.toLowerCase() === customer.email.toLowerCase()
  );
}

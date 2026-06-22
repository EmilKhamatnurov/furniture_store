import { redirect } from "next/navigation";
import { createOrderAccessToken } from "@/modules/orders";

// ---------------------------------------------------------------------------
// /orders/[orderId]/payment-result
//
// YuKassa redirects the user here after the payment form (success or cancel).
// The webhook may not have been processed yet when the user arrives, so we
// simply redirect to the order page — it will show the current status.
// We mint a fresh access token so a guest returning from payment can view
// their order (the order page hides PII without a token / ownership).
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentResultPage({ params }: PageProps) {
  const { orderId } = await params;
  const token = createOrderAccessToken(orderId);
  redirect(`/orders/${orderId}?t=${token}`);
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  fetchYukassaPayment: vi.fn(),
  processPaymentSucceeded: vi.fn(),
  processPaymentCancelled: vi.fn(),
  recordWebhookEvent: vi.fn(),
  markWebhookProcessed: vi.fn(),
  yukassaValueToCopecks: vi.fn(),
  sendPaymentReceivedEmails: vi.fn(),
}));

vi.mock("@/modules/payments", () => mocks);
vi.mock("@/modules/email", () => ({
  sendPaymentReceivedEmails: mocks.sendPaymentReceivedEmails,
}));

import { POST } from "./route";

const paymentId = "2f8fc0b5-4247-4f3f-a26f-7a27ca61f72e";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/payments/yukassa/webhook", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function notification(event = "payment.succeeded") {
  return { type: "notification", event, object: { id: paymentId, status: "pending" } };
}

describe("YuKassa webhook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.yukassaValueToCopecks.mockReturnValue(13150000n);
    mocks.recordWebhookEvent.mockResolvedValue({ duplicate: false, eventId: "event-1" });
    mocks.processPaymentSucceeded.mockResolvedValue({ orderId: "order-1", alreadyProcessed: false });
    mocks.processPaymentCancelled.mockResolvedValue(undefined);
    mocks.markWebhookProcessed.mockResolvedValue(undefined);
    mocks.sendPaymentReceivedEmails.mockResolvedValue(undefined);
  });

  it("rejects malformed payloads", async () => {
    const response = await POST(request({ type: "notification" }));
    expect(response.status).toBe(400);
    expect(mocks.recordWebhookEvent).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate without repeating payment side effects", async () => {
    mocks.fetchYukassaPayment.mockResolvedValue({ status: "succeeded", amount: { value: "131500.00" } });
    mocks.recordWebhookEvent.mockResolvedValue({ duplicate: true, eventId: null });

    const response = await POST(request(notification()));

    expect(response.status).toBe(200);
    expect(mocks.processPaymentSucceeded).not.toHaveBeenCalled();
    expect(mocks.sendPaymentReceivedEmails).not.toHaveBeenCalled();
  });

  it("does not trust the event name and processes the verified cancelled status", async () => {
    mocks.fetchYukassaPayment.mockResolvedValue({ status: "cancelled", amount: { value: "131500.00" } });

    const response = await POST(request(notification("payment.succeeded")));

    expect(response.status).toBe(200);
    expect(mocks.processPaymentCancelled).toHaveBeenCalledWith(paymentId);
    expect(mocks.processPaymentSucceeded).not.toHaveBeenCalled();
    expect(mocks.markWebhookProcessed).toHaveBeenCalledWith(
      `payment.succeeded:${paymentId}`,
      "ok"
    );
  });

  it("records an unverifiable event as an error without marking an order paid", async () => {
    mocks.fetchYukassaPayment.mockRejectedValue(new Error("network unavailable"));

    const response = await POST(request(notification()));

    expect(response.status).toBe(200);
    expect(mocks.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({ signatureValid: "no" })
    );
    expect(mocks.markWebhookProcessed).toHaveBeenCalledWith(
      `payment.succeeded:${paymentId}`,
      "error",
      "YuKassa verification failed"
    );
    expect(mocks.processPaymentSucceeded).not.toHaveBeenCalled();
  });

  it("sends email only after the first verified successful transition", async () => {
    mocks.fetchYukassaPayment.mockResolvedValue({ status: "succeeded", amount: { value: "131500.00" } });
    mocks.processPaymentSucceeded.mockResolvedValue({ orderId: "order-1", alreadyProcessed: true });

    const response = await POST(request(notification()));

    expect(response.status).toBe(200);
    expect(mocks.processPaymentSucceeded).toHaveBeenCalledWith(paymentId, 13150000n);
    expect(mocks.sendPaymentReceivedEmails).not.toHaveBeenCalled();
  });

  it("sends the payment email after a first verified successful transition", async () => {
    mocks.fetchYukassaPayment.mockResolvedValue({ status: "succeeded", amount: { value: "131500.00" } });

    const response = await POST(request(notification()));

    expect(response.status).toBe(200);
    expect(mocks.sendPaymentReceivedEmails).toHaveBeenCalledWith("order-1");
  });
});

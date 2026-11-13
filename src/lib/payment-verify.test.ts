import { describe, expect, it } from "vitest";
import { consumeIdempotencyKey, resetIdempotencyKeys } from "./idempotency";
import { reconcileTimedOutBooking, verifyRazorpaySignature } from "./payment-verify";

describe("payment verification", () => {
  it("rejects invalid signatures", () => {
    expect(
      verifyRazorpaySignature({
        orderId: "o",
        paymentId: "p",
        signature: "a",
        expectedSignature: "b",
      }).valid,
    ).toBe(false);
  });

  it("confirms booking from webhook after API timeout", () => {
    expect(
      reconcileTimedOutBooking({
        paymentStatus: "SUCCESS",
        bookingStatus: "PENDING",
        webhookReceived: true,
      }),
    ).toBe("CONFIRMED");
  });

  it("blocks duplicate Pay Now keys", () => {
    resetIdempotencyKeys();
    expect(consumeIdempotencyKey("k1").duplicate).toBe(false);
    expect(consumeIdempotencyKey("k1").duplicate).toBe(true);
  });
});

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  expectedSignature: string;
}) {
  if (!input.orderId || !input.paymentId || !input.signature) {
    return { valid: false, reason: "missing_fields" as const };
  }
  if (input.signature !== input.expectedSignature) {
    return { valid: false, reason: "invalid_signature" as const };
  }
  return { valid: true as const };
}

export function reconcileTimedOutBooking(input: {
  paymentStatus: "SUCCESS" | "FAILED" | "PENDING";
  bookingStatus: "PENDING" | "CONFIRMED" | "FAILED";
  webhookReceived: boolean;
}) {
  if (input.paymentStatus === "SUCCESS" && input.webhookReceived) {
    return "CONFIRMED";
  }
  if (input.paymentStatus === "FAILED") {
    return "FAILED";
  }
  return input.bookingStatus;
}

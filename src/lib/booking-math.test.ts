import { describe, expect, it } from "vitest";
import {
  allocateScarceInventory,
  assertTicketAvailability,
  bookingTotal,
  remainingAfterHold,
} from "./booking-math";

describe("booking calculations", () => {
  it("sums line totals", () => {
    expect(
      bookingTotal([
        { quantity: 2, unitPrice: 799 },
        { quantity: 1, unitPrice: 2499 },
      ]),
    ).toBe(4097);
  });

  it("blocks oversell", () => {
    expect(() =>
      assertTicketAvailability([{ quantity: 3, unitPrice: 100, availableQuantity: 2 }]),
    ).toThrow(/exceeds/);
  });

  it("decrements remaining", () => {
    expect(remainingAfterHold(20, 4)).toBe(16);
  });

  it("gives last 20 tickets to the first 20 of 500 buyers", () => {
    const result = allocateScarceInventory(20, Array.from({ length: 500 }, () => 1));
    expect(result.filter((r) => r.allocated === 1)).toHaveLength(20);
    expect(result.at(-1)?.remaining).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { isValidOtpFormat, validateOtp } from "./otp";

describe("OTP validation", () => {
  it("accepts a 6-digit match", () => {
    expect(
      validateOtp({
        otp: "123456",
        expected: "123456",
        createdAt: Date.now(),
        attempts: 0,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects format", () => {
    expect(isValidOtpFormat("12ab")).toBe(false);
    expect(
      validateOtp({
        otp: "12",
        expected: "123456",
        createdAt: Date.now(),
        attempts: 0,
      }).reason,
    ).toBe("invalid_format");
  });

  it("expires after 5 minutes", () => {
    expect(
      validateOtp({
        otp: "123456",
        expected: "123456",
        createdAt: Date.now() - 6 * 60 * 1000,
        attempts: 0,
      }).reason,
    ).toBe("expired");
  });

  it("locks after 5 attempts", () => {
    expect(
      validateOtp({
        otp: "123456",
        expected: "123456",
        createdAt: Date.now(),
        attempts: 5,
      }).reason,
    ).toBe("too_many_attempts");
  });
});

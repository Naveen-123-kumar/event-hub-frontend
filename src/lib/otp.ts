const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function isValidOtpFormat(otp: string) {
  return /^\d{6}$/.test(otp);
}

export function isOtpExpired(createdAt: number, now = Date.now()) {
  return now - createdAt > OTP_TTL_MS;
}

export function canRetryOtp(attempts: number) {
  return attempts < MAX_ATTEMPTS;
}

export function validateOtp(input: {
  otp: string;
  expected: string;
  createdAt: number;
  attempts: number;
  now?: number;
}) {
  if (!isValidOtpFormat(input.otp)) {
    return { ok: false as const, reason: "invalid_format" };
  }
  if (isOtpExpired(input.createdAt, input.now)) {
    return { ok: false as const, reason: "expired" };
  }
  if (!canRetryOtp(input.attempts)) {
    return { ok: false as const, reason: "too_many_attempts" };
  }
  if (input.otp !== input.expected) {
    return { ok: false as const, reason: "mismatch" };
  }
  return { ok: true as const };
}

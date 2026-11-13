import { describe, expect, it } from "vitest";

function queueNotification(ok: boolean) {
  if (!ok) return { queued: true, delivered: false };
  return { queued: true, delivered: true };
}

describe("notification logic", () => {
  it("queues when email is down", () => {
    expect(queueNotification(false)).toEqual({ queued: true, delivered: false });
  });
});

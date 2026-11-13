import { describe, expect, it } from "vitest";
import { decodeAccessToken, isTokenExpired } from "./jwt";

function token(payload: object) {
  return `hdr.${btoa(JSON.stringify(payload))}.sig`;
}

describe("auth token logic", () => {
  it("reads role and userId", () => {
    const decoded = decodeAccessToken(
      token({ userId: "u1", role: "customer", exp: Math.floor(Date.now() / 1000) + 60 }),
    );
    expect(decoded?.role).toBe("customer");
  });

  it("treats missing exp as expired", () => {
    expect(isTokenExpired(token({ userId: "u1", role: "customer" }))).toBe(true);
  });
});

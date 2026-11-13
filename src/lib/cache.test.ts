import { describe, expect, it } from "vitest";
import { MemoryCache } from "./cache";

describe("cache logic", () => {
  it("returns a hit within TTL", async () => {
    const cache = new MemoryCache();
    let loads = 0;
    const loader = async () => {
      loads += 1;
      return 42;
    };
    expect(await cache.wrap("k", 1000, loader)).toBe(42);
    expect(await cache.wrap("k", 1000, loader)).toBe(42);
    expect(loads).toBe(1);
  });

  it("misses after expiry", async () => {
    const cache = new MemoryCache();
    cache.set("k", "old", -1);
    expect(cache.get("k")).toBeNull();
  });
});

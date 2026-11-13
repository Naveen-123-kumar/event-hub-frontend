import { describe, expect, it, vi } from "vitest";

function debounce<T>(fn: (value: T) => void, ms: number) {
  let handle: ReturnType<typeof setTimeout> | undefined;
  return (value: T) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(value), ms);
  };
}

describe("search debounce", () => {
  it("fires once after the quiet period", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const run = debounce(spy, 300);
    run("j");
    run("ja");
    run("jaz");
    vi.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("jaz");
    vi.useRealTimers();
  });
});

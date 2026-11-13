type Entry<T> = { value: T; expiresAt: number };

export class MemoryCache {
  private store = new Map<string, Entry<unknown>>();

  set<T>(key: string, value: T, ttlMs: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
    const hit = this.get<T>(key);
    if (hit !== null) return Promise.resolve(hit);
    return loader().then((value) => {
      this.set(key, value, ttlMs);
      return value;
    });
  }

  clear() {
    this.store.clear();
  }
}

export const pageCache = new MemoryCache();

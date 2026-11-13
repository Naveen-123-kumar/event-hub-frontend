export function createIdempotencyKey(prefix = "pay") {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

const seen = new Set<string>();

export function consumeIdempotencyKey(key: string) {
  if (seen.has(key)) {
    return { duplicate: true };
  }
  seen.add(key);
  return { duplicate: false };
}

export function resetIdempotencyKeys() {
  seen.clear();
}

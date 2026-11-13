import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { backendUrl } from "@/lib/config";
import { ApiError } from "@/lib/api/client";

/**
 * Cached public GET. Do not pass cache: "no-store" — that blocks instant navigation.
 * Call from a `'use cache'` function or this helper.
 */
export async function publicFetch<T>(path: string, tag = "events"): Promise<T> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tag);

  const res = await fetch(`${backendUrl}${path}`, {
    next: { tags: [tag] },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (json as { message?: string }).message ?? "Upstream request failed",
      res.status,
    );
  }
  return json as T;
}

/** Cookie-aware fetch. Only call from a component wrapped in <Suspense>. */
export async function serverFetch<T>(path: string): Promise<T> {
  const jar = await cookies();
  const access = jar.get("eh_access")?.value;
  const hdrs = new Headers({ "Content-Type": "application/json" });
  if (access) hdrs.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`${backendUrl}${path}`, { headers: hdrs });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (json as { message?: string }).message ?? "Upstream request failed",
      res.status,
    );
  }
  return json as T;
}

import { cmsUrl } from "@/lib/config";
import { ApiError } from "@/lib/api/client";

/** Used inside `'use cache'` CMS loaders. Do not set cache: "no-store". */
export async function cmsServerFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${cmsUrl}${path}`, {
    next: { tags: ["cms"] },
  });
  if (!res.ok) throw new ApiError("CMS request failed", res.status);
  return res.json() as Promise<T>;
}

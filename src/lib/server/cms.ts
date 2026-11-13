import { cacheLife, cacheTag } from "next/cache";
import { catalogIfEmpty, mockBanners, mockFaqs, mockPages } from "@/lib/mocks/data";
import { cmsServerFetch } from "@/lib/http/cms-fetch";
import { cmsUrl } from "@/lib/config";
import type { CmsBanner, CmsFaq } from "@/lib/types";

type StrapiEntity<T> = T & {
  id: number;
  attributes?: T & { image?: { data?: { attributes?: { url?: string } }; url?: string } };
  image?: { url?: string };
};

function mediaUrl(entity: StrapiEntity<{ image?: { url?: string } }>): string | undefined {
  const nested =
    entity.attributes?.image?.data?.attributes?.url ??
    entity.attributes?.image?.url ??
    entity.image?.url;
  if (!nested) return undefined;
  if (nested.startsWith("http")) return nested;
  return `${cmsUrl}${nested}`;
}

/** ISR: Strapi FAQs refresh about every hour. */
export async function getFaqsIsr(): Promise<CmsFaq[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cms-faqs");
  try {
    const json = await cmsServerFetch<{
      data: StrapiEntity<{ question?: string; answer?: string; category?: string }>[];
    }>("/api/faqs");
    const rows = json.data ?? [];
    const mapped = rows.map((row) => ({
      id: row.id,
      question: row.attributes?.question ?? row.question ?? "",
      answer: String(row.attributes?.answer ?? row.answer ?? ""),
      category: row.attributes?.category ?? row.category ?? "general",
    }));
    return catalogIfEmpty(mapped, mockFaqs);
  } catch {
    return mockFaqs;
  }
}

/** ISR: promotional banners from Strapi. */
export async function getBannersIsr(): Promise<CmsBanner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cms-banners");
  try {
    const json = await cmsServerFetch<{
      data: StrapiEntity<{
        title?: string;
        subtitle?: string;
        ctaLabel?: string;
        ctaUrl?: string;
      }>[];
    }>("/api/promotional-banners?populate=image");
    const rows = json.data ?? [];
    const mapped = rows.map((row) => ({
      id: row.id,
      title: row.attributes?.title ?? row.title ?? "",
      subtitle: row.attributes?.subtitle ?? row.subtitle,
      ctaLabel: row.attributes?.ctaLabel ?? row.ctaLabel,
      ctaHref: row.attributes?.ctaUrl ?? row.ctaUrl,
      imageUrl: mediaUrl(row),
    }));
    return catalogIfEmpty(mapped, mockBanners);
  } catch {
    return mockBanners;
  }
}

export async function getStaticPageIsr(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("cms-pages");
  try {
    const json = await cmsServerFetch<{
      data: StrapiEntity<{ title?: string; content?: string; excerpt?: string }>[];
    }>(`/api/static-pages?filters[slug][$eq]=${encodeURIComponent(slug)}`);
    const row = json.data?.[0];
    if (!row) return mockPages.find((page) => page.slug === slug) ?? null;
    const content = row.attributes?.content ?? row.content ?? "";
    const paragraphs = content
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!paragraphs.length) return mockPages.find((page) => page.slug === slug) ?? null;
    return {
      slug,
      title: row.attributes?.title ?? row.title ?? slug,
      excerpt: row.attributes?.excerpt ?? row.excerpt,
      paragraphs,
    };
  } catch {
    return mockPages.find((page) => page.slug === slug) ?? null;
  }
}

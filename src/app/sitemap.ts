import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getPublishedEventsForSitemap } from "@/lib/server/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getPublishedEventsForSitemap();
  const staticRoutes: MetadataRoute.Sitemap = ["", "/events", "/faq", "/about", "/terms"].map(
    (path) => ({
      url: `${siteUrl}${path || "/"}`,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.7,
    }),
  );

  return [
    ...staticRoutes,
    ...events.map((event) => ({
      url: `${siteUrl}/events/${event._id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}

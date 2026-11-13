import type { Metadata } from "next";
import { siteUrl } from "@/lib/config";
import type { EventRecord } from "@/lib/types";

export const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  locale: "en_IN",
  siteName: "EventHub",
  url: siteUrl,
};

export function eventMetadata(event: EventRecord): Metadata {
  const title = event.title;
  const description =
    event.description?.slice(0, 160) ??
    `${event.venue}, ${event.city}. Tickets on EventHub.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/events/${event._id}` },
    openGraph: {
      ...defaultOpenGraph,
      title,
      description,
      type: "article",
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function eventJsonLd(event: EventRecord) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: { "@type": "PostalAddress", addressLocality: event.city },
    },
    image: event.imageUrl,
    organizer: { "@type": "Organization", name: "EventHub" },
  };
}

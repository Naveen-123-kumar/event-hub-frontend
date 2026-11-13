import { cacheLife, cacheTag } from "next/cache";
import { catalogIfEmpty, mockEvents } from "@/lib/mocks/data";
import { envelopeData, normalizeEvent } from "@/lib/http/normalize";
import { backendUrl } from "@/lib/config";
import type { EventRecord, Paginated } from "@/lib/types";

function paginate(items: EventRecord[], page: number, limit: number): Paginated<EventRecord> {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    },
  };
}

function applyFilters(events: EventRecord[], q?: string, city?: string, sort = "startDate") {
  let next = events.filter((event) => event.status === "PUBLISHED" || event.status === "DRAFT");
  const query = q?.trim().toLowerCase();
  if (query) {
    next = next.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query),
    );
  }
  if (city) {
    next = next.filter((event) => event.city.toLowerCase() === city.toLowerCase());
  }
  next.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  return next;
}

async function fetchJson(path: string) {
  const res = await fetch(`${backendUrl}${path}`, {
    next: { tags: ["events"] },
  });
  if (!res.ok) throw new Error(`Events API ${res.status}`);
  return res.json();
}

/** Cached public catalogue — included in the instant navigation shell. */
export async function getEventsSsr(opts: {
  q?: string;
  city?: string;
  page?: number;
  sort?: string;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");

  const page = opts.page ?? 1;
  const qs = new URLSearchParams({ page: String(page), limit: "9" });
  if (opts.q) qs.set("q", opts.q);
  if (opts.city) qs.set("city", opts.city);
  if (opts.sort) qs.set("sort", opts.sort);

  try {
    const json = await fetchJson(`/api/events?${qs.toString()}`);
    const rows = catalogIfEmpty(
      Array.isArray(json.data) ? json.data.map(normalizeEvent) : [],
      applyFilters(mockEvents, opts.q, opts.city, opts.sort),
    );
    if (json.pagination && Array.isArray(json.data) && json.data.length > 0) {
      return { data: rows, pagination: json.pagination as Paginated<EventRecord>["pagination"] };
    }
    return paginate(rows, page, 9);
  } catch {
    return paginate(applyFilters(mockEvents, opts.q, opts.city, opts.sort), page, 9);
  }
}

export async function getEventSsr(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("events", `event-${id}`);

  try {
    const json = await fetchJson(`/api/events/${id}`);
    const event = normalizeEvent(envelopeData<Record<string, unknown>>(json));
    return event ?? mockEvents.find((item) => item._id === id) ?? null;
  } catch {
    return mockEvents.find((event) => event._id === id) ?? null;
  }
}

export async function getPublishedEventsForSitemap() {
  "use cache";
  cacheLife("hours");
  cacheTag("events");

  try {
    const json = await fetchJson("/api/events?limit=50");
    const rows = envelopeData<Record<string, unknown>[]>(json);
    const events = catalogIfEmpty(
      Array.isArray(rows) ? rows.map(normalizeEvent) : [],
      mockEvents,
    );
    return events.filter((event) => event.status === "PUBLISHED");
  } catch {
    return mockEvents.filter((event) => event.status === "PUBLISHED");
  }
}

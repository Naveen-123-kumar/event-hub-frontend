import { EVENT_IMAGE_FALLBACK } from "@/lib/config";
import type { EventRecord, TicketRecord } from "@/lib/types";

function idOf(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value ?? "");
}

export function normalizeEvent(raw: Record<string, unknown>): EventRecord {
  return {
    _id: idOf(raw._id ?? raw.id),
    title: String(raw.title ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    venue: String(raw.venue ?? ""),
    city: String(raw.city ?? ""),
    startDate: new Date(String(raw.startDate)).toISOString(),
    endDate: new Date(String(raw.endDate)).toISOString(),
    capacity: Number(raw.capacity ?? 0),
    registeredCount: Number(raw.registeredCount ?? 0),
    status: (raw.status as EventRecord["status"]) ?? "DRAFT",
    organizationId: raw.organizationId ? idOf(raw.organizationId) : undefined,
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : EVENT_IMAGE_FALLBACK,
    category: raw.category ? String(raw.category) : undefined,
  };
}

export function normalizeTicket(raw: Record<string, unknown>): TicketRecord {
  return {
    _id: idOf(raw._id ?? raw.id),
    eventId: idOf(raw.eventId),
    name: String(raw.name ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    price: Number(raw.price ?? 0),
    quantity: Number(raw.quantity ?? 0),
    availableQuantity: Number(raw.availableQuantity ?? 0),
    saleStartDate: new Date(String(raw.saleStartDate)).toISOString(),
    saleEndDate: new Date(String(raw.saleEndDate)).toISOString(),
    status: (raw.status as TicketRecord["status"]) ?? "ACTIVE",
  };
}

export function envelopeData<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

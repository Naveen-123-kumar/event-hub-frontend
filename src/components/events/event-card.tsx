"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { MapPin } from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { EVENT_IMAGE_FALLBACK } from "@/lib/config";
import { formatDate } from "@/lib/format";
import type { EventRecord } from "@/lib/types";

function EventCardInner({ event }: { event: EventRecord }) {
  return (
    <Link href={`/events/${event._id}`} className="group block">
      <Card className="overflow-hidden transition duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-[16/10]">
          <Image
            src={event.imageUrl ?? EVENT_IMAGE_FALLBACK}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3">
            <Badge tone="ink">{event.category ?? event.status}</Badge>
          </div>
        </div>
        <div className="grid gap-2 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-rust">
            {formatDate(event.startDate)}
          </p>
          <h3 className="font-display text-2xl leading-tight">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-ink/60">
            <MapPin className="h-3.5 w-3.5" />
            {event.venue}, {event.city}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export const EventCard = memo(EventCardInner, (prev, next) => {
  return (
    prev.event._id === next.event._id &&
    prev.event.title === next.event.title &&
    prev.event.startDate === next.event.startDate &&
    prev.event.registeredCount === next.event.registeredCount
  );
});

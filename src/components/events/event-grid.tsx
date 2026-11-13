"use client";

import { memo } from "react";
import type { EventRecord } from "@/lib/types";
import { EventCard } from "./event-card";
import { EmptyState } from "@/components/ui/skeleton";

function EventGridInner({ events }: { events: EventRecord[] }) {
  if (events.length === 0) {
    return <EmptyState title="No rooms tonight" body="Try another city or clear the search." />;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}

export const EventGrid = memo(EventGridInner);

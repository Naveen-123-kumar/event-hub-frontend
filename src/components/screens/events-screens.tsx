"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { getEvent, getEventTickets, listEvents } from "@/lib/api/services";
import { mockCities } from "@/lib/mocks/data";
import { formatCurrency, formatRange } from "@/lib/format";
import { assertTicketAvailability } from "@/lib/booking-math";
import type { CartItem, EventRecord, TicketRecord } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";

export function EventListScreen() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    listEvents({ q, city: city || undefined, page })
      .then((res) => {
        setEvents(res.data);
        setPages(res.pagination.pages);
      })
      .finally(() => setLoading(false));
  }, [q, city, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rust">Calendar</p>
          <h1 className="font-display text-4xl sm:text-5xl">What is on</h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <Input
            placeholder="Search title or city"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <Select
            value={city}
            onChange={(e) => {
              setPage(1);
              setCity(e.target.value);
            }}
          >
            <option value="">All cities</option>
            {mockCities.map((cityName) => (
              <option key={cityName}>{cityName}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)
          : events.map((event) => <EventCard key={event._id} event={event} />)}
      </div>
      {!loading && events.length === 0 ? (
        <EmptyState title="No rooms tonight" body="Try another city or clear the search." />
      ) : null}
      <div className="mt-8 flex justify-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function EventDetailScreen({ initialEvent }: { initialEvent?: EventRecord }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setItems = useCartStore((s) => s.setItems);
  const push = useToastStore((s) => s.push);
  const [event, setEvent] = useState<EventRecord | null>(initialEvent ?? null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});

  useEffect(() => {
    const eventId = initialEvent?._id ?? id;
    if (!eventId) return;
    Promise.all([
      initialEvent ? Promise.resolve(initialEvent) : getEvent(eventId),
      getEventTickets(eventId),
    ]).then(([e, t]) => {
      setEvent(e);
      setTickets(t);
    });
  }, [id, initialEvent]);

  const selected = useMemo(() => {
    if (!event) return [] as CartItem[];
    return tickets
      .filter((ticket) => (qty[ticket._id] ?? 0) > 0)
      .map((ticket) => ({
        eventId: event._id,
        eventTitle: event.title,
        ticketId: ticket._id,
        ticketName: ticket.name,
        unitPrice: ticket.price,
        quantity: qty[ticket._id],
        availableQuantity: ticket.availableQuantity,
      }));
  }, [event, qty, tickets]);

  const total = selected.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (!event) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem]">
            <Image
              src={event.imageUrl ?? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80"}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>
          <div className="mt-6">
            <Badge>{event.city}</Badge>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">{event.title}</h1>
            <p className="mt-2 text-ink/65">{formatRange(event.startDate, event.endDate)}</p>
            <p className="mt-4 max-w-2xl text-ink/80">{event.description}</p>
            <p className="mt-4 text-sm text-ink/55">
              {event.venue} · {event.registeredCount}/{event.capacity} registered
            </p>
          </div>
        </div>
        <Card className="h-fit p-5 sm:p-6">
          <h2 className="font-display text-2xl">Tickets</h2>
          <div className="mt-4 grid gap-4">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="rounded-2xl border border-ink/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{ticket.name}</p>
                    <p className="text-sm text-ink/55">{ticket.description}</p>
                    <p className="mt-1 text-sm">{formatCurrency(ticket.price)}</p>
                    <p className="text-xs text-ink/45">{ticket.availableQuantity} left</p>
                  </div>
                  <Select
                    className="w-20"
                    value={String(qty[ticket._id] ?? 0)}
                    onChange={(e) =>
                      setQty((prev) => ({ ...prev, [ticket._id]: Number(e.target.value) }))
                    }
                  >
                    {Array.from({ length: Math.min(8, ticket.availableQuantity) + 1 }).map(
                      (_, n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-ink/60">Total</span>
            <span className="font-display text-2xl">{formatCurrency(total)}</span>
          </div>
          <Button
            className="mt-4 w-full"
            variant="accent"
            disabled={selected.length === 0}
            onClick={() => {
              if (!user) {
                router.push("/login");
                return;
              }
              try {
                assertTicketAvailability(selected);
                setItems(selected);
                router.push("/checkout");
              } catch (error) {
                push({
                  title: "Cannot hold those tickets",
                  description: error instanceof Error ? error.message : "",
                  tone: "err",
                });
              }
            }}
          >
            Continue to checkout
          </Button>
        </Card>
      </div>
    </div>
  );
}

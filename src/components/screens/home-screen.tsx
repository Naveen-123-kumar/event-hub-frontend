"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listBanners, listEvents } from "@/lib/api/services";
import type { CmsBanner, EventRecord } from "@/lib/types";

export function HomeScreen() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [banner, setBanner] = useState<CmsBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listEvents({ page: 1 }), listBanners()])
      .then(([listed, banners]) => {
        setEvents(listed.data.filter((e) => e.status === "PUBLISHED").slice(0, 3));
        setBanner(banners[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {banner?.imageUrl ? (
            <Image
              src={banner.imageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/25" />
        </div>
        <div className="relative mx-auto grid min-h-[72vh] max-w-7xl content-end gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:content-center lg:px-8">
          <div className="text-parchment">
            <p className="text-xs uppercase tracking-[0.28em] text-rust">Live rooms, honest inventory</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              {banner?.title ?? "Tickets that still feel like a night out."}
            </h1>
            <p className="mt-4 max-w-md text-parchment/75">
              {banner?.subtitle ??
                "Holds last 15 minutes. Payments settle in MySQL. Events live in Mongo. You just pick a seat."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={banner?.ctaHref ?? "/events"}>
                <Button variant="accent" size="lg">
                  {banner?.ctaLabel ?? "Browse events"}
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-parchment/30 bg-transparent text-parchment hover:bg-white/10"
                >
                  Create account
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden rounded-[2rem] border border-white/15 bg-white/8 p-6 text-parchment backdrop-blur md:block">
            <p className="text-sm uppercase tracking-[0.2em] text-parchment/60">Tonight’s hold</p>
            <p className="mt-4 font-display text-4xl">15:00</p>
            <p className="mt-2 text-sm text-parchment/70">
              Inventory is reserved only while checkout is open. Double Pay Now shares one idempotency key.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-rust">This month</p>
            <h2 className="font-display text-4xl">On the board</h2>
          </div>
          <Link href="/events" className="text-sm text-ink/70">
            All events →
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

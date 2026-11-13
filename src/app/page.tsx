import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { EventGrid } from "@/components/events/event-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_IMAGE_FALLBACK } from "@/lib/config";
import { getBannersIsr } from "@/lib/server/cms";
import { getEventsSsr } from "@/lib/server/events";
import type { EventRecord } from "@/lib/types";

export default async function Page() {
  const banners = await getBannersIsr();
  const banner = banners[0];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={banner?.imageUrl ?? EVENT_IMAGE_FALLBACK}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/25" />
        </div>
        <div className="relative mx-auto grid min-h-[72vh] max-w-7xl content-end gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:content-center lg:px-8">
          <div className="text-parchment">
            <p className="text-xs uppercase tracking-[0.28em] text-rust">ISR hero · SSR rail</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              {banner?.title ?? "Tickets that still feel like a night out."}
            </h1>
            <p className="mt-4 max-w-md text-parchment/75">
              {banner?.subtitle ??
                "Holds last 15 minutes. Payments settle in MySQL. Events live in Mongo."}
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
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          }
        >
          <HomeEventRail />
        </Suspense>
      </section>
    </>
  );
}

async function HomeEventRail() {
  const listed = await getEventsSsr({ page: 1 });
  const published = listed.data
    .filter((event: EventRecord) => event.status === "PUBLISHED")
    .slice(0, 6);
  return <EventGrid events={published} />;
}

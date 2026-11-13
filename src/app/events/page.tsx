import { Suspense } from "react";
import type { Metadata } from "next";
import { EventFilters } from "@/components/events/event-filters";
import { EventGrid } from "@/components/events/event-grid";
import { EventPagination } from "@/components/events/event-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventsSsr } from "@/lib/server/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse live events, filter by city, and hold tickets for 15 minutes.",
  alternates: { canonical: "/events" },
};

export default function Page({ searchParams }: PageProps<"/events">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rust">Calendar</p>
          <h1 className="font-display text-4xl sm:text-5xl">What is on</h1>
        </div>
        <Suspense fallback={<Skeleton className="h-11 w-full md:w-96" />}>
          <EventFilters />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          }
        >
          <EventResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function EventResults({
  searchParams,
}: Pick<PageProps<"/events">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const city = typeof params.city === "string" ? params.city : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const page = Number(params.page ?? 1) || 1;

  const listed = await getEventsSsr({ q, city, page, sort });
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (city) query.set("city", city);
  if (sort) query.set("sort", sort);

  return (
    <>
      <EventGrid events={listed.data} />
      <EventPagination
        page={listed.pagination.page}
        pages={listed.pagination.pages}
        query={query.toString()}
      />
    </>
  );
}

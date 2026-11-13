import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventDetailScreen } from "@/components/screens/events-screens";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventSsr, getPublishedEventsForSitemap } from "@/lib/server/events";
import { eventJsonLd, eventMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const events = await getPublishedEventsForSitemap();
  return events.map((event) => ({ id: event._id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventSsr(id);
  if (!event) return { title: "Event" };
  return eventMetadata(event);
}

export default function Page({ params }: PageProps<"/events/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-[420px]" />
        </div>
      }
    >
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: Pick<PageProps<"/events/[id]">, "params">) {
  const { id } = await params;
  const event = await getEventSsr(id);
  if (!event) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <EventDetailScreen initialEvent={event} />
    </>
  );
}

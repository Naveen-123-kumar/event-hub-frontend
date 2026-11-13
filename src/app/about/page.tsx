import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPageIsr } from "@/lib/server/cms";

export const metadata: Metadata = {
  title: "About",
  description:
    "EventHub is a multi-tenant ticketing platform: Next.js, Express, MongoDB events, MySQL payments, Redis cache, Strapi CMS.",
  alternates: { canonical: "/about" },
};

export default async function Page() {
  const page = await getStaticPageIsr("about");
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-rust">SSG · app catalog</p>
      <h1 className="font-display text-5xl">{page.title}</h1>
      {page.excerpt ? <p className="mt-3 text-sm text-ink/55">{page.excerpt}</p> : null}
      <div className="mt-6 grid gap-4 text-ink/70">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getFaqsIsr } from "@/lib/server/cms";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Ticketing, transfers, and venue questions. Content is managed in Strapi and revalidated hourly (ISR).",
};

export default async function Page() {
  const faqs = await getFaqsIsr();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-rust">ISR · Strapi</p>
      <h1 className="font-display text-4xl">FAQ</h1>
      <p className="mt-2 text-sm text-ink/55">
        Sourced from the CMS. Cache tag <code>cms-faqs</code> refreshes about every hour.
      </p>
      <div className="mt-6 grid gap-3">
        {faqs.map((faq) => (
          <Card key={faq.id} className="p-5">
            <p className="font-medium">{faq.question}</p>
            <p className="mt-2 text-sm text-ink/65">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

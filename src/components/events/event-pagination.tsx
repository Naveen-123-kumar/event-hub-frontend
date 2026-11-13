"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EventPagination({
  page,
  pages,
  query,
}: {
  page: number;
  pages: number;
  query: string;
}) {
  const prev = page - 1;
  const next = page + 1;
  const hrefFor = (p: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(p));
    return `/events?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(prev)}>
          <Button variant="outline">Previous</Button>
        </Link>
      ) : (
        <Button variant="outline" disabled>
          Previous
        </Button>
      )}
      {page < pages ? (
        <Link href={hrefFor(next)}>
          <Button variant="outline">Next</Button>
        </Link>
      ) : (
        <Button variant="outline" disabled>
          Next
        </Button>
      )}
    </div>
  );
}

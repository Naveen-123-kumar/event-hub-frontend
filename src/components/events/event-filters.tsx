"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { mockCities } from "@/lib/mocks/data";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "startDate");
  const debouncedQ = useDebouncedValue(q, 400);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const next = new URLSearchParams();
    if (debouncedQ) next.set("q", debouncedQ);
    if (city) next.set("city", city);
    if (sort && sort !== "startDate") next.set("sort", sort);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [city, debouncedQ, pathname, router, sort]);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
      <Input
        placeholder="Search title, venue, city"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search events"
      />
      <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter city">
        <option value="">All cities</option>
        {mockCities.map((cityName) => (
          <option key={cityName}>{cityName}</option>
        ))}
      </Select>
      <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort events">
        <option value="startDate">Date</option>
        <option value="title">Title</option>
      </Select>
    </div>
  );
}

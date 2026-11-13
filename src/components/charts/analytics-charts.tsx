"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockEvents, mockPayments } from "@/lib/mocks/data";

const revenue = mockPayments.map((payment) => ({
  name: payment.bookingNumber?.slice(-6) ?? payment.id,
  value: payment.amount / 1000,
}));

const occupancy = mockEvents
  .filter((event) => event.status === "PUBLISHED")
  .map((event) => ({
    name: event.title.split(" ").slice(0, 2).join(" "),
    value: Math.round((event.registeredCount / Math.max(event.capacity, 1)) * 100),
  }));

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-64 rounded-3xl border border-ink/8 bg-white/60 p-4">
        <p className="mb-2 text-sm text-ink/55">Catalog payments (₹ thousands)</p>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A181420" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#E85D04" fill="#E85D0422" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-3xl border border-ink/8 bg-white/60 p-4">
        <p className="mb-2 text-sm text-ink/55">Capacity used %</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={occupancy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A181420" />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#0F4C5C" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

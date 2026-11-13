"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Ticket,
  Users,
} from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { RequireAuth } from "./require-auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminShell({ children }: { children: import("react").ReactNode }) {
  return (
    <RequireAuth admin>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:w-60">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">
            Organizer
          </p>
          <Suspense fallback={<div className="h-10" />}>
            <AdminNav />
          </Suspense>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </RequireAuth>
  );
}

function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:gap-1 lg:overflow-visible">
      {nav.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm lg:rounded-2xl",
              active ? "bg-ink text-parchment" : "text-ink/70 hover:bg-ink/5",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

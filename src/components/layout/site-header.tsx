"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Ticket, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

const links = [
  { href: "/events", label: "Events" },
  { href: "/bookings", label: "My bookings" },
  { href: "/notifications", label: "Alerts" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-parchment/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ink text-parchment">
            <Ticket className="h-4 w-4" />
          </span>
          EventHub
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink/65 transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdminRole(user.role) ? (
                <Link href="/admin">
                  <Button size="sm" variant="outline">
                    Admin
                  </Button>
                </Link>
              ) : null}
              <Link href="/profile" className="text-sm text-ink/70">
                {user.email}
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="accent">
                  Get tickets
                </Button>
              </Link>
            </>
          )}
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-ink/8 px-4 py-4 md:hidden">
          <div className="grid gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                {isAdminRole(user.role) ? (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                ) : null}
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink/8 bg-ink text-parchment">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-2xl">EventHub</p>
          <p className="mt-2 max-w-xs text-sm text-parchment/65">
            Tickets, holds, and payouts for live rooms that still feel like a night out.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-parchment/75">
          <p className="font-medium text-parchment">Explore</p>
          <Link href="/events">All events</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="grid gap-2 text-sm text-parchment/75">
          <p className="font-medium text-parchment">Account</p>
          <Link href="/bookings">My bookings</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/login">Sign in</Link>
        </div>
        <div className="grid gap-2 text-sm text-parchment/75">
          <p className="font-medium text-parchment">Legal</p>
          <Link href="/terms">Terms</Link>
          <p>CMS-backed copy via Strapi.</p>
        </div>
      </div>
    </footer>
  );
}

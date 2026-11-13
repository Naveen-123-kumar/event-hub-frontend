import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-ink/8 bg-white/70 shadow-[0_20px_50px_-28px_rgba(26,24,20,0.35)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "rust" | "teal" | "ok" | "warn";
}) {
  const map = {
    ink: "bg-ink/8 text-ink",
    rust: "bg-rust/12 text-rust",
    teal: "bg-teal/12 text-teal",
    ok: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function DismissButton({
  onClick,
  label = "Close notification",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-current/70 transition hover:bg-black/10 hover:text-current",
        className,
      )}
    >
      <X className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

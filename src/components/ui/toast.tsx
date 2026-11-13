"use client";

import { useEffect } from "react";
import { DismissButton } from "@/components/ui/dismiss-button";
import { useToastStore } from "@/stores/toast-store";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] grid w-[min(92vw,360px)] gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDone={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  title,
  description,
  tone,
  onDone,
}: {
  title: string;
  description?: string;
  tone?: "ok" | "err";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-2 rounded-2xl border px-4 py-3 shadow-lg ${
        tone === "err"
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-ink/10 bg-ink text-parchment"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-0.5 text-xs opacity-80">{description}</p> : null}
      </div>
      <DismissButton
        onClick={onDone}
        className={tone === "err" ? "hover:bg-red-100" : "hover:bg-white/10"}
      />
    </div>
  );
}

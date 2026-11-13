"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink/50">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  "aria-invalid": invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      aria-invalid={invalid}
      className={cn(
        "h-11 w-full rounded-xl border bg-white/80 px-3 text-sm text-ink outline-none ring-rust/30 transition placeholder:text-ink/35 focus:border-rust/40 focus:ring-2",
        invalid ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-ink/12",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-ink/12 bg-white/80 px-3 py-2 text-sm text-ink outline-none ring-rust/30 transition placeholder:text-ink/35 focus:border-rust/40 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((open) => !open)}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-ink/12 bg-white/80 px-3 text-sm text-ink outline-none focus:border-rust/40 focus:ring-2 focus:ring-rust/30",
        className,
      )}
      {...props}
    />
  );
}

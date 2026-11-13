import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-ink text-parchment hover:bg-ink/90 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset]",
  accent: "bg-rust text-white hover:bg-rust/90",
  outline: "border border-ink/15 bg-white/70 text-ink hover:bg-white",
  ghost: "text-ink/80 hover:bg-ink/5",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

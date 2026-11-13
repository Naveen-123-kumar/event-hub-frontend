"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Toaster } from "./ui/toast";

export function Providers({ children }: { children: import("react").ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

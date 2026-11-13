"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireAuth({
  children,
  admin,
}: {
  children: import("react").ReactNode;
  admin?: boolean;
}) {
  const { user, hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (admin && !isAdminRole(user.role)) {
      router.replace("/events");
    }
  }, [admin, hydrated, router, user]);

  if (!hydrated || !user || (admin && !isAdminRole(user.role))) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}

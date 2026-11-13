import type { ReactNode } from "react";
import { Suspense } from "react";
import { PageBackButton } from "./page-back";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Suspense fallback={null}>
        <PageBackButton />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

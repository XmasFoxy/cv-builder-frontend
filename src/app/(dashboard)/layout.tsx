
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="dashboard flex h-dvh overflow-hidden bg-(--dashboard-background) text-(--dashboard-text)">
      <AppSidebar />

      <main
        tabIndex={0}
        className="min-w-0 flex-1 overflow-auto px-8 py-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--dashboard-muted)"
      >
        {children}
      </main>
    </div>
  );
}

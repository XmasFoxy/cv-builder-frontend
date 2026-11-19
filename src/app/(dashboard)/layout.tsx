
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f5f7] text-[#2e2e2e]">
      <AppSidebar />

      <main className="min-w-0 flex-1 px-8 py-8">
        {children}
      </main>
    </div>
  );
}

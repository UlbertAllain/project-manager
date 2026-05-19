"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AppSidebar } from "./AppSidebar";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { Menu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OfflineIndicator } from "@/components/OfflineIndicator";

interface AppShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch?: () => void;
  onSelectProject: (id: string) => void;
  children: React.ReactNode;
}

export function AppShell({
  currentView,
  onNavigate,
  onOpenSearch,
  onSelectProject,
  children,
}: AppShellProps) {
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Will be handled by page.tsx
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex h-screen bg-base-bg">
        <div className="hidden md:flex w-60 border-r border-base-border flex-col gap-4 p-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-bg overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with mobile menu + breadcrumbs */}
        <div className="flex items-center h-12 px-4 border-b border-base-border shrink-0 gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded hover:bg-base-hover text-text-muted hover:text-text-main md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs + Search + Notifications */}
          <BreadcrumbNav
            currentView={currentView}
            onNavigate={onNavigate}
            onOpenSearch={onOpenSearch}
            onSelectProject={onSelectProject}
          />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <OfflineIndicator />
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

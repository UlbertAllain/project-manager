"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AppShell } from "@/components/layout/AppShell";
import { LoginView } from "@/components/views/LoginView";
import { DashboardView } from "@/components/views/DashboardView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { ProjectDetailView } from "@/components/views/ProjectDetailView";
import { BoardView } from "@/components/views/BoardView";
import { FinanceView } from "@/components/views/FinanceView";

type ViewType =
  | "login"
  | "dashboard"
  | "projects"
  | "project-detail"
  | "board"
  | "finance";

// Hydration-safe client-only check
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const isMounted = useIsMounted();
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Derive view from auth state (only after mount to avoid hydration mismatch)
  const effectiveView: ViewType =
    !isMounted
      ? "login"
      : !isAuthenticated
        ? "login"
        : currentView === "login"
          ? "dashboard"
          : currentView;

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewType);
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView("project-detail");
  };

  const handleBackFromDetail = () => {
    setSelectedProjectId(null);
    setCurrentView("projects");
  };

  const handleLogin = () => {
    setCurrentView("dashboard");
  };

  // Show spinner while hydrating
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login view (no shell)
  if (effectiveView === "login" || !isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Authenticated views (with shell)
  const renderContent = () => {
    switch (effectiveView) {
      case "dashboard":
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
          />
        );
      case "projects":
        return <ProjectsView onSelectProject={handleSelectProject} />;
      case "project-detail":
        return selectedProjectId ? (
          <ProjectDetailView
            projectId={selectedProjectId}
            onBack={handleBackFromDetail}
          />
        ) : (
          <ProjectsView onSelectProject={handleSelectProject} />
        );
      case "board":
        return <BoardView onSelectProject={handleSelectProject} />;
      case "finance":
        return <FinanceView />;
      default:
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
          />
        );
    }
  };

  return (
    <AppShell currentView={effectiveView} onNavigate={handleNavigate}>
      {renderContent()}
    </AppShell>
  );
}

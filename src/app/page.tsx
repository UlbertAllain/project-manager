"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AppShell } from "@/components/layout/AppShell";
import { LoginView } from "@/components/views/LoginView";
import { DashboardView } from "@/components/views/DashboardView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { ProjectDetailView } from "@/components/views/ProjectDetailView";
import { BoardView } from "@/components/views/BoardView";
import { FinanceView } from "@/components/views/FinanceView";
import { SettingsView } from "@/components/views/SettingsView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useActivitySocket } from "@/hooks/useActivitySocket";
import { AnimatePresence, motion } from "framer-motion";

type ViewType =
  | "login"
  | "dashboard"
  | "projects"
  | "project-detail"
  | "board"
  | "finance"
  | "settings";

// Hydration-safe client-only check
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const isMounted = useIsMounted();
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [searchOpen, setSearchOpen] = useState(false);

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

  // WebSocket real-time sync (active only for authenticated users)
  useActivitySocket();

  // Keyboard shortcuts — Escape handler
  const handleEscape = useCallback(() => {
    if (searchOpen) {
      setSearchOpen(false);
    } else if (effectiveView === "project-detail") {
      handleBackFromDetail();
    }
  }, [searchOpen, effectiveView]);

  // Keyboard shortcuts — New project handler
  const handleNewProject = useCallback(() => {
    setCurrentView("projects");
  }, []);

  // Register global keyboard shortcuts (disabled when on login view)
  useKeyboardShortcuts({
    onNavigate: handleNavigate,
    onOpenSearch: () => setSearchOpen(true),
    onNewProject: handleNewProject,
    onEscape: handleEscape,
    disabled: effectiveView === "login",
  });

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
        return <FinanceView onSelectProject={handleSelectProject} />;
      case "settings":
        return <SettingsView onNavigate={handleNavigate} />;
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
    <>
      <AppShell
        currentView={effectiveView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectProject={handleSelectProject}
      >
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveView + (selectedProjectId || "")}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </AppShell>

      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={handleNavigate}
        onSelectProject={handleSelectProject}
      />
    </>
  );
}

"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  DollarSign,
  LogOut,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "board", label: "Board", icon: KanbanSquare },
  { key: "finance", label: "Finance", icon: DollarSign },
];

export function AppSidebar({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}: AppSidebarProps) {
  const { user, logout } = useAuthStore();

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 bg-base-bg border-r border-base-border flex flex-col transition-transform duration-200 ease-in-out",
          "md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-base-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-main tracking-tight">
              Nexty Labs
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-base-hover text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.key ||
              (item.key === "projects" && currentView === "project-detail");

            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-base-hover text-text-main"
                    : "text-text-muted hover:text-text-main hover:bg-base-hover/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-brand-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-base-border p-3 shrink-0">
          {user && (
            <div className="px-2 mb-2">
              <p className="text-xs text-text-main truncate">{user.name}</p>
              <p className="text-[11px] text-text-subtle truncate">
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

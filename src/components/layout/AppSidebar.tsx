"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  DollarSign,
  Settings,
  LogOut,
  X,
  Zap,
  Keyboard,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { ShortcutsHelpDialog } from "@/components/shortcuts/ShortcutsHelpDialog";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: ["G", "D"] },
  { key: "projects", label: "Projects", icon: FolderKanban, shortcut: ["G", "P"] },
  { key: "board", label: "Board", icon: KanbanSquare, shortcut: ["G", "B"] },
  { key: "finance", label: "Finance", icon: DollarSign, shortcut: ["G", "F"] },
];

const settingsItem = { key: "settings", label: "Settings", icon: Settings, shortcut: ["G", "S"] };

export function AppSidebar({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}: AppSidebarProps) {
  const { user, logout } = useAuthStore();
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

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
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors group",
                  isActive
                    ? "bg-base-hover text-text-main"
                    : "text-text-muted hover:text-text-main hover:bg-base-hover/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive ? (
                  <div className="w-1 h-1 rounded-full bg-brand-primary" />
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 lg:opacity-60 transition-opacity">
                    <ShortcutHint keys={item.shortcut} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Divider before Settings */}
          <div className="my-2 mx-2 h-px bg-base-border" />

          {/* Settings item */}
          {(() => {
            const Icon = settingsItem.icon;
            const isActive = currentView === settingsItem.key;
            return (
              <button
                onClick={() => handleNavigate(settingsItem.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition-colors group",
                  isActive
                    ? "bg-base-hover text-text-main"
                    : "text-text-subtle hover:text-text-main hover:bg-base-hover/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{settingsItem.label}</span>
                {isActive ? (
                  <div className="w-1 h-1 rounded-full bg-brand-primary" />
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 lg:opacity-60 transition-opacity">
                    <ShortcutHint keys={settingsItem.shortcut} />
                  </span>
                )}
              </button>
            );
          })()}
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

          {/* Theme toggle + Shortcuts row */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 mb-0.5">
            <ThemeToggle />
            <button
              onClick={() => setShortcutsHelpOpen(true)}
              className="flex-1 flex items-center gap-2.5 px-1 py-0.5 rounded text-[13px] font-medium text-text-muted hover:text-text-main hover:bg-base-hover/60 transition-colors"
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>Shortcuts</span>
              <span className="ml-auto opacity-60">
                <ShortcutHint keys={["?"]} />
              </span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Shortcuts Help Dialog */}
      <ShortcutsHelpDialog
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </>
  );
}

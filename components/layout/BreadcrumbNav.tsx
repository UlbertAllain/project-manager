"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  DollarSign,
  Settings,
  ChevronRight,
  Search,
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface BreadcrumbNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch?: () => void;
  onSelectProject: (id: string) => void;
}

const viewConfig: Record<
  string,
  { label: string; icon: React.ElementType; parent?: string }
> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  projects: { label: "Projects", icon: FolderKanban },
  "project-detail": {
    label: "Project Detail",
    icon: FolderKanban,
    parent: "projects",
  },
  board: { label: "Board", icon: KanbanSquare },
  finance: { label: "Finance", icon: DollarSign },
  settings: { label: "Settings", icon: Settings },
};

export function BreadcrumbNav({
  currentView,
  onNavigate,
  onOpenSearch,
  onSelectProject,
}: BreadcrumbNavProps) {
  const config = viewConfig[currentView];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onNavigate("dashboard")}
              className="cursor-pointer text-text-subtle hover:text-text-main text-xs"
            >
              <LayoutDashboard className="w-3 h-3 mr-1 inline" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>

          {config.parent && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="w-3 h-3 text-text-subtle" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => onNavigate(config.parent!)}
                  className="cursor-pointer text-text-subtle hover:text-text-main text-xs"
                >
                  {viewConfig[config.parent!]?.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}

          <BreadcrumbSeparator>
            <ChevronRight className="w-3 h-3 text-text-subtle" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-medium text-text-main flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {config.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Search trigger button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-base-border bg-base-card hover:bg-base-hover text-text-subtle hover:text-text-muted transition-colors"
            aria-label="Open search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search</span>
            <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-base-hover text-text-subtle border border-base-border">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Notification bell */}
        <NotificationCenter
          onNavigate={onNavigate}
          onSelectProject={onSelectProject}
        />
      </div>
    </div>
  );
}

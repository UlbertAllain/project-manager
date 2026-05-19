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
  ChevronRight,
} from "lucide-react";

interface BreadcrumbNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
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
};

export function BreadcrumbNav({ currentView, onNavigate }: BreadcrumbNavProps) {
  const config = viewConfig[currentView];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Breadcrumb>
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
  );
}

"use client";

import { useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  DollarSign,
  Settings,
  Plus,
  Search,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { STATUS_LABELS, STATUS_BADGE_CLASSES, PRIORITY_BADGE_CLASSES } from "@/lib/constants";
import type { Project } from "@/lib/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  onSelectProject: (id: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { id: "projects", label: "Projects", icon: FolderKanban, keywords: "list all" },
  { id: "board", label: "Board", icon: KanbanSquare, keywords: "kanban drag drop" },
  { id: "finance", label: "Finance", icon: DollarSign, keywords: "money income expense" },
  { id: "settings", label: "Settings", icon: Settings, keywords: "preferences profile theme appearance" },
];

function ProjectResultItem({ project }: { project: Project }) {
  const statusLabel = STATUS_LABELS[project.status] || project.status;
  const statusClass = STATUS_BADGE_CLASSES[project.status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  const priorityClass = PRIORITY_BADGE_CLASSES[project.priority] || "";

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <FolderKanban className="w-4 h-4 shrink-0 text-text-muted" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-main truncate">{project.projectName}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-text-muted truncate">{project.clientName}</span>
          {project.projectLead && (
            <>
              <span className="text-text-subtle text-xs">·</span>
              <span className="text-xs text-text-subtle truncate">{project.projectLead}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {priorityClass && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priorityClass}`}>
            {project.priority}
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onSelectProject,
}: CommandPaletteProps) {
  const { data: projects = [] } = useProjects();

  const handleNavigate = useCallback(
    (view: string) => {
      onNavigate(view);
      onOpenChange(false);
    },
    [onNavigate, onOpenChange]
  );

  const handleSelectProject = useCallback(
    (id: string) => {
      onSelectProject(id);
      onOpenChange(false);
    },
    [onSelectProject, onOpenChange]
  );

  const handleNewProject = useCallback(() => {
    onNavigate("projects");
    onOpenChange(false);
  }, [onNavigate, onOpenChange]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in input/textarea fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search across projects, navigation, and quick actions"
      showCloseButton={false}
      className="sm:max-w-lg bg-base-card border-base-border backdrop-blur-xl [&_[data-slot=dialog-overlay]]:bg-black/60 [&_[data-slot=dialog-overlay]]:backdrop-blur-sm"
    >
      {/* Custom styling for the command input area */}
      <CommandInput
        placeholder="Search projects, navigate, or take action..."
        className="text-text-main placeholder:text-text-subtle"
      />

      <CommandList className="max-h-80">
        <CommandEmpty className="text-text-muted py-8 text-sm">
          <div className="flex flex-col items-center gap-2">
            <Search className="w-5 h-5 text-text-subtle" />
            <span>No results found</span>
          </div>
        </CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation" className="[&_[cmdk-group-heading]]:text-text-subtle">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => handleNavigate(item.id)}
                className="py-2 px-3 cursor-pointer data-[selected=true]:bg-brand-primary/10 data-[selected=true]:text-brand-primary rounded-md"
              >
                <Icon className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-main">{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator className="bg-base-border" />

        {/* Projects Group */}
        <CommandGroup heading="Projects" className="[&_[cmdk-group-heading]]:text-text-subtle">
          {projects.map((project) => (
            <CommandItem
              key={project.id}
              value={`${project.projectName} ${project.clientName} ${project.projectLead} ${project.status} ${project.priority} ${project.category}`}
              onSelect={() => handleSelectProject(project.id)}
              className="py-2 px-3 cursor-pointer data-[selected=true]:bg-brand-primary/10 data-[selected=true]:text-brand-primary rounded-md"
            >
              <ProjectResultItem project={project} />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-base-border" />

        {/* Quick Actions Group */}
        <CommandGroup heading="Quick Actions" className="[&_[cmdk-group-heading]]:text-text-subtle">
          <CommandItem
            value="New Project Create Add"
            onSelect={handleNewProject}
            className="py-2 px-3 cursor-pointer data-[selected=true]:bg-brand-primary/10 data-[selected=true]:text-brand-primary rounded-md"
          >
            <Plus className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-main">New Project</span>
            <span className="ml-auto text-[10px] text-text-subtle font-mono">⌘N</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-base-border text-[10px] text-text-subtle">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-base-hover text-text-muted font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-base-hover text-text-muted font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-base-hover text-text-muted font-mono">esc</kbd>
            close
          </span>
        </div>
        <span className="text-text-subtle">{projects.length} projects</span>
      </div>
    </CommandDialog>
  );
}

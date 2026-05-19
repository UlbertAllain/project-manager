"use client";

import { useState, useEffect, useMemo } from "react";
import { Project } from "@/lib/types";
import {
  BOARD_COLUMNS,
  STATUS_LABELS,
  STATUS_COLORS,
  COLUMN_HEADER_CLASSES,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
  PROJECT_STATUSES,
} from "@/lib/constants";
import { formatRupiah, formatDate, getDeadlineStatus } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KanbanSquare,
  List,
  Search,
  FolderKanban,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BoardViewProps {
  onSelectProject: (id: string) => void;
}

type ViewMode = "kanban" | "list";

export function BoardView({ onSelectProject }: BoardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedProject) return;

    const project = projects.find((p) => p.id === draggedProject);
    if (!project || project.status === newStatus) {
      setDraggedProject(null);
      return;
    }

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === draggedProject ? { ...p, status: newStatus } : p
      )
    );

    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "COMPLETED") {
        updateData.progress = 100;
        updateData.completedDate = new Date().toISOString();
      }
      await fetch(`/api/projects/${draggedProject}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      toast.success(`Dipindahkan ke ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Gagal mengubah status");
      fetchProjects();
    } finally {
      setDraggedProject(null);
    }
  };

  // Quick status change (for list view)
  const handleQuickStatusChange = async (
    projectId: string,
    newStatus: string
  ) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status === newStatus) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );

    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "COMPLETED") {
        updateData.progress = 100;
        updateData.completedDate = new Date().toISOString();
      }
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      toast.success(`Dipindahkan ke ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Gagal mengubah status");
      fetchProjects();
    }
  };

  const getColumnProjects = (status: string) =>
    projects.filter((p) => p.status === status);

  // Filtered projects for list view
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !search ||
        p.projectName.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "ALL" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [projects, search, categoryFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category));
    return Array.from(cats);
  }, [projects]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-base-card rounded animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {BOARD_COLUMNS.map((_, i) => (
            <div
              key={i}
              className="w-72 shrink-0 h-96 bg-base-card rounded-lg border border-base-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Board</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {viewMode === "kanban"
              ? "Drag & drop untuk mengubah status project"
              : "List view dengan quick status change"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-base-card border border-base-border rounded-md p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "kanban"
                  ? "bg-base-hover text-text-main"
                  : "text-text-subtle hover:text-text-muted"
              }`}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-base-hover text-text-main"
                  : "text-text-subtle hover:text-text-muted"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters (shown in list mode) */}
      {viewMode === "list" && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari project..."
              className="w-full h-8 pl-8 pr-3 text-sm bg-base-card border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-36 text-xs bg-base-card border-base-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {viewMode === "kanban" ? (
        /* ========== KANBAN VIEW ========== */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {BOARD_COLUMNS.map((status) => {
            const columnProjects = getColumnProjects(status);
            return (
              <div
                key={status}
                className="w-72 shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div
                    className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-zinc-500"}`}
                  />
                  <span className="text-xs font-medium text-text-muted">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-[10px] text-text-subtle ml-auto">
                    {columnProjects.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[200px]">
                  <AnimatePresence initial={false}>
                    {columnProjects.map((project) => {
                      const deadlineStatus = getDeadlineStatus(
                        project.status,
                        project.deadline
                      );
                      return (
                        <motion.div
                          key={project.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onDragEnd={() => setDraggedProject(null)}
                          onClick={() => onSelectProject(project.id)}
                          className={`bg-base-card border border-base-border rounded-lg p-3 cursor-grab hover:border-base-border/80 active:cursor-grabbing transition-colors ${
                            draggedProject === project.id
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          <h4 className="text-sm font-medium text-text-main mb-1.5 truncate">
                            {project.projectName}
                          </h4>

                          <p className="text-[11px] text-text-subtle mb-2 truncate">
                            {project.clientName}
                          </p>

                          <div className="flex items-center gap-1 mb-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${PRIORITY_BADGE_CLASSES[project.priority] || ""}`}
                            >
                              {project.priority}
                            </Badge>
                            {deadlineStatus === "OVERDUE" && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 bg-red-500/10 text-red-400 border-red-500/20"
                              >
                                Overdue
                              </Badge>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <Progress
                              value={project.progress}
                              className="h-1 flex-1"
                            />
                            <span className="text-[10px] text-text-subtle w-7 text-right">
                              {project.progress}%
                            </span>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-2 text-[10px] text-text-subtle">
                            <span>
                              {project.budget > 0
                                ? formatRupiah(project.budget)
                                : "-"}
                            </span>
                            <span>
                              {project.deadline
                                ? formatDate(project.deadline, {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "-"}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========== LIST VIEW ========== */
        <div className="space-y-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-text-subtle" />
              </div>
              <p className="text-sm text-text-subtle">
                Tidak ada project ditemukan
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const deadlineStatus = getDeadlineStatus(
                project.status,
                project.deadline
              );
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectProject(project.id)}
                  className="bg-base-card border border-base-border rounded-lg p-3 hover:border-base-border/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-text-main truncate">
                          {project.projectName}
                        </h4>
                        {deadlineStatus === "OVERDUE" && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 bg-red-500/10 text-red-400 border-red-500/20 shrink-0"
                          >
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-subtle">
                        <span>{project.clientName}</span>
                        <span>·</span>
                        <span>{project.category}</span>
                        <span>·</span>
                        <span>{project.progress}%</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${PRIORITY_BADGE_CLASSES[project.priority] || ""}`}
                      >
                        {project.priority}
                      </Badge>
                    </div>

                    {/* Quick status change */}
                    <Select
                      value={project.status}
                      onValueChange={(v) => {
                        handleQuickStatusChange(project.id, v);
                      }}
                    >
                      <SelectTrigger
                        className={`h-7 w-32 text-[10px] ${STATUS_BADGE_CLASSES[project.status] || ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

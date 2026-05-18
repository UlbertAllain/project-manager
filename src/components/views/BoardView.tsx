"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import {
  BOARD_COLUMNS,
  STATUS_LABELS,
  STATUS_COLORS,
  COLUMN_HEADER_CLASSES,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
} from "@/lib/constants";
import { formatRupiah, formatDate, getDeadlineStatus } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface BoardViewProps {
  onSelectProject: (id: string) => void;
}

export function BoardView({ onSelectProject }: BoardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

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

  const handleDrop = async (
    e: React.DragEvent,
    newStatus: string
  ) => {
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

  const getColumnProjects = (status: string) =>
    projects.filter((p) => p.status === status);

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
      <div>
        <h1 className="text-xl font-semibold text-text-main">Board</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Drag & drop untuk mengubah status project
        </p>
      </div>

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
                {columnProjects.map((project) => {
                  const deadlineStatus = getDeadlineStatus(
                    project.status,
                    project.deadline
                  );
                  return (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project.id)}
                      onDragEnd={() => setDraggedProject(null)}
                      onClick={() => onSelectProject(project.id)}
                      className={`bg-base-card border border-base-border rounded-lg p-3 cursor-pointer hover:border-base-border/80 transition-colors ${
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

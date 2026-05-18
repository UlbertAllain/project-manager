"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
  PAYMENT_BADGE_CLASSES,
} from "@/lib/constants";
import {
  formatRupiah,
  formatDate,
  getDeadlineStatus,
  formatBudgetShort,
} from "@/lib/helpers";
import {
  FolderKanban,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectProject: (id: string) => void;
}

export function DashboardView({
  onNavigate,
  onSelectProject,
}: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => !["COMPLETED", "CANCELLED"].includes(p.status)
  ).length;
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalPaid = projects.reduce((acc, p) => acc + p.paidAmount, 0);
  const overdueProjects = projects.filter(
    (p) => getDeadlineStatus(p.status, p.deadline) === "OVERDUE"
  );

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: FolderKanban,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Revenue",
      value: formatBudgetShort(totalPaid),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Overdue",
      value: overdueProjects.length,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  // Recent projects (last 5)
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  // Near deadline projects
  const nearDeadline = projects
    .filter(
      (p) =>
        getDeadlineStatus(p.status, p.deadline) !== "SAFE" &&
        !["COMPLETED", "CANCELLED"].includes(p.status)
    )
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-base-card rounded-lg border border-base-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold text-text-main">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Overview semua project dan keuangan
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-base-card border border-base-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-muted font-medium">
                  {stat.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-md ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-lg font-semibold text-text-main">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Budget overview */}
      <div className="bg-base-card border border-base-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-main">
            Budget Overview
          </h3>
          <span className="text-xs text-text-muted">
            {formatRupiah(totalPaid)} / {formatRupiah(totalBudget)}
          </span>
        </div>
        <Progress
          value={totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0}
          className="h-2"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-text-subtle">
            {totalBudget > 0
              ? `${Math.round((totalPaid / totalBudget) * 100)}% terbayar`
              : "Belum ada budget"}
          </span>
          <span className="text-[11px] text-text-subtle">
            Sisa: {formatRupiah(totalBudget - totalPaid)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-base-border">
            <h3 className="text-sm font-medium text-text-main">
              Project Terbaru
            </h3>
            <button
              onClick={() => onNavigate("projects")}
              className="text-xs text-brand-primary hover:underline flex items-center gap-1"
            >
              Lihat semua
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-base-border">
            {recentProjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-subtle">
                Belum ada project
              </div>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="w-full text-left px-4 py-3 hover:bg-base-hover/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-main font-medium truncate">
                      {project.projectName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE_CLASSES[project.status] || ""}`}
                    >
                      {STATUS_LABELS[project.status] || project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-subtle">
                    <span>{project.clientName}</span>
                    <span>·</span>
                    <span>{project.progress}%</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Near Deadline */}
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-base-border">
            <h3 className="text-sm font-medium text-text-main flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Deadline Mendekat
            </h3>
          </div>
          <div className="divide-y divide-base-border">
            {nearDeadline.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-subtle">
                Tidak ada project mendekati deadline
              </div>
            ) : (
              nearDeadline.map((project) => {
                const deadlineStatus = getDeadlineStatus(
                  project.status,
                  project.deadline
                );
                return (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="w-full text-left px-4 py-3 hover:bg-base-hover/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-main font-medium truncate">
                        {project.projectName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          deadlineStatus === "OVERDUE"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {deadlineStatus === "OVERDUE"
                          ? "Overdue"
                          : "Warning"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-text-subtle">
                      <span>Deadline: {formatDate(project.deadline)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

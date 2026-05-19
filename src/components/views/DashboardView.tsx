"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_COLORS,
  PRIORITY_BADGE_CLASSES,
  PAYMENT_BADGE_CLASSES,
  PROJECT_STATUSES,
  ACTIVE_STATUSES,
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
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectProject: (id: string) => void;
}

const CHART_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#71717a",
  "#ef4444",
  "#22c55e",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalPaid = projects.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalExpense = projects.reduce((acc, p) => acc + p.totalExpense, 0);
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
      label: "Active",
      value: activeProjects,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Revenue",
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

  // Chart data: Status distribution
  const statusChartData = PROJECT_STATUSES.map((status) => ({
    name: STATUS_LABELS[status] || status,
    count: projects.filter((p) => p.status === status).length,
  })).filter((d) => d.count > 0);

  // Chart data: Budget by category
  const categoryMap = new Map<string, { budget: number; paid: number }>();
  projects.forEach((p) => {
    const existing = categoryMap.get(p.category) || { budget: 0, paid: 0 };
    categoryMap.set(p.category, {
      budget: existing.budget + p.budget,
      paid: existing.paid + p.paidAmount,
    });
  });
  const budgetChartData = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      name: category,
      Budget: data.budget,
      Paid: data.paid,
    })
  );

  // Custom tooltip for charts
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-card border border-base-border rounded-lg p-2 text-xs shadow-lg">
          <p className="text-text-main font-medium mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}: {p.name === "Budget" || p.name === "Paid" ? formatRupiah(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-6xl"
    >
      {/* Page title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-semibold text-text-main">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Overview semua project dan keuangan
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-base-card border border-base-border rounded-lg p-4 hover:border-base-border/80 transition-colors"
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
      </motion.div>

      {/* Budget overview */}
      <motion.div
        variants={itemVariants}
        className="bg-base-card border border-base-border rounded-lg p-4"
      >
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
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Status Distribution Pie Chart */}
        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-main">
              Distribusi Status
            </h3>
          </div>
          {statusChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-subtle">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  stroke="none"
                >
                  {statusChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: "11px", color: "#71717a" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Budget by Category Bar Chart */}
        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-main">
              Budget per Kategori
            </h3>
          </div>
          {budgetChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-text-subtle">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={budgetChartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Budget"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Paid"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Lists row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
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
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-text-subtle" />
                </div>
                <p className="text-sm text-text-subtle">Belum ada project</p>
                <p className="text-xs text-text-subtle mt-1">
                  Buat project pertama untuk memulai
                </p>
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
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-text-subtle">
                  Semua project aman
                </p>
                <p className="text-xs text-text-subtle mt-1">
                  Tidak ada project mendekati deadline
                </p>
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
                        {deadlineStatus === "OVERDUE" ? "Overdue" : "Warning"}
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
      </motion.div>
    </motion.div>
  );
}

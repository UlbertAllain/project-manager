"use client";

import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PROJECT_STATUSES,
} from "@/lib/constants";
import {
  formatRupiah,
  formatDate,
  getDeadlineStatus,
  formatBudgetShort,
  formatRelativeTime,
  getDaysRemaining,
  getLogIcon,
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
  CircleDollarSign,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useProjects } from "@/hooks/useProjects";
import { useTransactions } from "@/hooks/useTransactions";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { SmartInsights } from "@/components/ai/SmartInsights";
import { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton, CardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loader";

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

// Custom tooltip for charts - defined outside component to avoid re-creation
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
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
            {p.name}: {p.name === "Budget" || p.name === "Paid" || p.name === "Income" || p.name === "Expense" ? formatRupiah(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Deadline urgency color helper
function getDeadlineUrgencyColor(daysRemaining: number): {
  border: string;
  text: string;
  bg: string;
} {
  if (daysRemaining < 0) return { border: "border-l-red-500", text: "text-red-400", bg: "bg-red-500/10" };
  if (daysRemaining <= 1) return { border: "border-l-orange-500", text: "text-orange-400", bg: "bg-orange-500/10" };
  if (daysRemaining <= 3) return { border: "border-l-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" };
  if (daysRemaining <= 7) return { border: "border-l-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10" };
  return { border: "border-l-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" };
}

function formatDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} hari terlambat`;
  if (days === 0) return "Hari ini";
  return `${days} hari lagi`;
}

// Health score calculation for project health indicator
function calculateHealthScore(project: Project): { score: number; budget: boolean; taskRate: string; deadlineRisk: string } {
  let score = 100;

  // Budget health: expense should not exceed budget proportionally to progress
  if (project.budget > 0) {
    const budgetRatio = project.totalExpense / project.budget;
    const progressRatio = project.progress / 100;
    if (budgetRatio > progressRatio * 1.2) score -= 25; // Over-budget relative to progress
    else if (budgetRatio > progressRatio) score -= 10;
  }

  // Task completion
  const taskTotal = project.tasks?.length || 0;
  const taskCompleted = project.tasks?.filter((t) => t.isCompleted).length || 0;
  const taskRate = taskTotal > 0 ? taskCompleted / taskTotal : 0;
  if (taskTotal > 0) {
    if (taskRate < project.progress / 100 * 0.8) score -= 20;
    else if (taskRate < project.progress / 100) score -= 10;
  }

  // Deadline risk
  let deadlineRisk = "safe";
  if (project.deadline) {
    const daysLeft = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000*60*60*24));
    const progressRemaining = 100 - project.progress;
    if (daysLeft < 0) { score -= 30; deadlineRisk = "overdue"; }
    else if (daysLeft < 7 && progressRemaining > 20) { score -= 20; deadlineRisk = "high"; }
    else if (daysLeft < 14 && progressRemaining > 40) { score -= 10; deadlineRisk = "medium"; }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    budget: project.budget > 0 ? (project.totalExpense / project.budget) <= (project.progress / 100 * 1.2) : true,
    taskRate: `${taskCompleted}/${taskTotal}`,
    deadlineRisk,
  };
}

export function DashboardView({
  onNavigate,
  onSelectProject,
}: DashboardViewProps) {
  const { data: projects = [], isLoading: loading } = useProjects();
  const { data: allTransactions = [] } = useTransactions();
  const { data: activityLogs = [] } = useActivityLogs();

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

  // Completed rate
  const completedRate =
    totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

  // Revenue trend calculation - monthly income & expense for last 6 months
  const now = new Date();
  const monthlyData: { month: string; Income: number; Expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const income = allTransactions
      .filter((t) => {
        if (t.type !== "INCOME") return false;
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      })
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = allTransactions
      .filter((t) => {
        if (t.type !== "EXPENSE") return false;
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      })
      .reduce((acc, t) => acc + t.amount, 0);
    monthlyData.push({
      month: d.toLocaleDateString("id-ID", { month: "short" }),
      Income: income,
      Expense: expense,
    });
  }

  // Revenue trend: compare last month vs previous month
  const thisMonthIncome = monthlyData[5]?.Income ?? 0;
  const lastMonthIncome = monthlyData[4]?.Income ?? 0;
  const revenueTrendPercent =
    lastMonthIncome > 0
      ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
      : thisMonthIncome > 0
        ? 100
        : 0;
  const revenueTrendUp = thisMonthIncome >= lastMonthIncome;

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: FolderKanban,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      sub: undefined as React.ReactNode | undefined,
    },
    {
      label: "Active",
      value: activeProjects,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      sub: undefined as React.ReactNode | undefined,
    },
    {
      label: "Revenue",
      value: formatBudgetShort(totalPaid),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: thisMonthIncome > 0 ? (
        <span
          className={`text-[10px] flex items-center gap-0.5 ${
            revenueTrendUp ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {revenueTrendUp ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {Math.abs(revenueTrendPercent)}% vs bln lalu
        </span>
      ) : undefined,
    },
    {
      label: "Overdue",
      value: overdueProjects.length,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      sub: undefined as React.ReactNode | undefined,
    },
    {
      label: "Completed Rate",
      value: `${completedRate}%`,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: (
        <span className="text-[10px] text-text-subtle">
          {completedProjects}/{totalProjects} project
        </span>
      ),
    },
    {
      label: "Total Expense",
      value: formatBudgetShort(totalExpense),
      icon: CircleDollarSign,
      color: "text-red-400",
      bg: "bg-red-500/10",
      sub: undefined as React.ReactNode | undefined,
    },
  ];

  // Recent projects (last 5)
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  // Near deadline projects — enhanced with days remaining and color coding
  const nearDeadline = projects
    .filter(
      (p) =>
        !["COMPLETED", "CANCELLED"].includes(p.status) &&
        p.deadline
    )
    .map((p) => ({
      ...p,
      daysRemaining: getDaysRemaining(p.deadline),
    }))
    .filter((p) => p.daysRemaining <= 14) // Show projects within 2 weeks or overdue
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  // Activity feed — max 8 items
  const activityFeed = activityLogs.slice(0, 8);

  // Health score data — active projects only, sorted worst first
  const healthScoreData = projects
    .filter((p) => !["COMPLETED", "CANCELLED"].includes(p.status))
    .map((p) => ({ project: p, health: calculateHealthScore(p) }))
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, 6);

  // Monthly comparison data
  const thisMonth = { income: 0, expense: 0, newProjects: 0, completedTasks: 0 };
  const lastMonth = { income: 0, expense: 0, newProjects: 0, completedTasks: 0 };
  const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  allTransactions.forEach((t) => {
    const tDate = new Date(t.date);
    if (tDate.getFullYear() === thisMonthDate.getFullYear() && tDate.getMonth() === thisMonthDate.getMonth()) {
      if (t.type === "INCOME") thisMonth.income += t.amount;
      else thisMonth.expense += t.amount;
    }
    if (tDate.getFullYear() === lastMonthDate.getFullYear() && tDate.getMonth() === lastMonthDate.getMonth()) {
      if (t.type === "INCOME") lastMonth.income += t.amount;
      else lastMonth.expense += t.amount;
    }
  });

  projects.forEach((p) => {
    const pDate = new Date(p.createdAt);
    if (pDate.getFullYear() === thisMonthDate.getFullYear() && pDate.getMonth() === thisMonthDate.getMonth()) {
      thisMonth.newProjects++;
    }
    if (pDate.getFullYear() === lastMonthDate.getFullYear() && pDate.getMonth() === lastMonthDate.getMonth()) {
      lastMonth.newProjects++;
    }
    const completedTasks = p.tasks?.filter((t) => t.isCompleted).length || 0;
    // Approximate: count all completed tasks towards this month for simplicity
    thisMonth.completedTasks += completedTasks;
  });
  // For last month comparison, we use the same completedTasks since we don't have historical task data
  lastMonth.completedTasks = 0; // No historical data available

  const comparisonCards = [
    {
      label: "Revenue",
      current: formatBudgetShort(thisMonth.income),
      change: lastMonth.income > 0 ? Math.round(((thisMonth.income - lastMonth.income) / lastMonth.income) * 100) : thisMonth.income > 0 ? 100 : 0,
      up: thisMonth.income >= lastMonth.income,
      color: thisMonth.income >= lastMonth.income ? "text-emerald-400" : "text-red-400",
      bg: "bg-emerald-500/10",
      icon: DollarSign,
    },
    {
      label: "Expense",
      current: formatBudgetShort(thisMonth.expense),
      change: lastMonth.expense > 0 ? Math.round(((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100) : thisMonth.expense > 0 ? 100 : 0,
      up: thisMonth.expense <= lastMonth.expense, // Lower expense is better
      color: thisMonth.expense <= lastMonth.expense ? "text-emerald-400" : "text-red-400",
      bg: "bg-red-500/10",
      icon: CircleDollarSign,
    },
    {
      label: "Project Baru",
      current: thisMonth.newProjects.toString(),
      change: lastMonth.newProjects > 0 ? Math.round(((thisMonth.newProjects - lastMonth.newProjects) / lastMonth.newProjects) * 100) : thisMonth.newProjects > 0 ? 100 : 0,
      up: thisMonth.newProjects >= lastMonth.newProjects,
      color: thisMonth.newProjects >= lastMonth.newProjects ? "text-emerald-400" : "text-red-400",
      bg: "bg-blue-500/10",
      icon: FolderKanban,
    },
    {
      label: "Task Selesai",
      current: thisMonth.completedTasks.toString(),
      change: 0,
      up: true,
      color: "text-emerald-400",
      bg: "bg-amber-500/10",
      icon: CheckCircle2,
    },
  ];

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

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <Skeleton className="h-6 w-28 mb-1" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
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

      {/* Stats cards — 6 cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
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
              {stat.sub && <div className="mt-1">{stat.sub}</div>}
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

      {/* Revenue Trend Area Chart */}
      <motion.div
        variants={itemVariants}
        className="bg-base-card border border-base-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-text-main">
            Tren Revenue & Expense
          </h3>
        </div>
        {monthlyData.every((d) => d.Income === 0 && d.Expense === 0) ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-subtle">
            Belum ada data transaksi
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", color: "#71717a" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
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

      {/* Smart Insights */}
      <motion.div variants={itemVariants}>
        <SmartInsights onNavigate={onNavigate} />
      </motion.div>

      {/* Project Health Score */}
      <motion.div
        variants={itemVariants}
        className="bg-base-card border border-base-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-medium text-text-main">
            Project Health Score
          </h3>
        </div>
        {healthScoreData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-text-subtle">
            Tidak ada project aktif
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {healthScoreData.map(({ project, health }) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="bg-base-bg border border-base-border rounded-lg p-3 hover:border-base-border/80 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Circular health score indicator */}
                  <svg className="w-14 h-14 shrink-0" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-base-border" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${health.score}, 100`} className={health.score > 70 ? 'text-emerald-400' : health.score > 40 ? 'text-amber-400' : 'text-red-400'} strokeLinecap="round" />
                    <text x="18" y="20.5" textAnchor="middle" className="text-[8px] font-semibold" fill="currentColor">
                      <tspan className={health.score > 70 ? 'text-emerald-400' : health.score > 40 ? 'text-amber-400' : 'text-red-400'}>{health.score}</tspan>
                    </text>
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-main truncate">{project.projectName}</p>
                    <p className="text-[11px] text-text-subtle">{project.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-subtle flex-wrap">
                  <span className={health.budget ? "text-emerald-400" : "text-red-400"}>
                    {health.budget ? "✓" : "✗"} Budget
                  </span>
                  <span className="text-base-border">·</span>
                  <span>Tasks {health.taskRate}</span>
                  <span className="text-base-border">·</span>
                  <span className={
                    health.deadlineRisk === "overdue" ? "text-red-400" :
                    health.deadlineRisk === "high" ? "text-orange-400" :
                    health.deadlineRisk === "medium" ? "text-amber-400" :
                    "text-emerald-400"
                  }>
                    {health.deadlineRisk === "overdue" ? "⚠ Overdue" :
                     health.deadlineRisk === "high" ? "⚠ High risk" :
                     health.deadlineRisk === "medium" ? "⚡ Medium" :
                     "✓ Deadline"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Activity Feed + Deadline Timeline */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Activity Feed */}
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-base-border">
            <h3 className="text-sm font-medium text-text-main flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Aktivitas Terbaru
            </h3>
            <button
              className="text-xs text-brand-primary hover:underline flex items-center gap-1"
              onClick={() => {
                /* placeholder — no navigation yet */
              }}
            >
              Lihat semua
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {activityFeed.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-text-subtle" />
                </div>
                <p className="text-sm text-text-subtle">Belum ada aktivitas</p>
                <p className="text-xs text-text-subtle mt-1">
                  Aktivitas akan tercatat otomatis
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-3 bottom-3 w-px bg-base-border" />
                {activityFeed.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    className="px-3 py-2 relative hover:bg-base-hover/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-base-hover border border-base-border flex items-center justify-center text-[10px] shrink-0 z-10 relative">
                        {getLogIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted truncate">
                          {log.message}
                        </p>
                      </div>
                      <button
                        onClick={() => onSelectProject(log.project.id)}
                        className="text-[10px] text-brand-primary hover:underline shrink-0 truncate max-w-[100px]"
                      >
                        {log.project.projectName}
                      </button>
                      <span className="text-[10px] text-text-subtle shrink-0 whitespace-nowrap">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deadline Timeline */}
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-base-border">
            <h3 className="text-sm font-medium text-text-main flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Deadline Timeline
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {nearDeadline.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-400 font-medium">
                  Semua aman
                </p>
                <p className="text-xs text-text-subtle mt-1">
                  Tidak ada project mendekati deadline
                </p>
              </div>
            ) : (
              <div className="divide-y divide-base-border">
                {nearDeadline.map((project) => {
                  const urgency = getDeadlineUrgencyColor(project.daysRemaining);
                  return (
                    <button
                      key={project.id}
                      onClick={() => onSelectProject(project.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-base-hover/50 transition-colors border-l-4 ${urgency.border}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-main font-medium truncate pr-2">
                          {project.projectName}
                        </span>
                        <span
                          className={`text-[11px] font-medium shrink-0 ${urgency.text}`}
                        >
                          {formatDaysLabel(project.daysRemaining)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-subtle">
                        <Clock className="w-3 h-3" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Monthly Comparison */}
      <motion.div variants={itemVariants}>
        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-main">
              Perbandingan Bulanan
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {comparisonCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-base-bg border border-base-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md ${card.bg} flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 ${card.color}`} />
                    </div>
                    <span className="text-[11px] text-text-muted">{card.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-text-main">{card.current}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {card.change !== 0 ? (
                      <>
                        {card.up ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-[11px] font-medium ${card.color}`}>
                          {Math.abs(card.change)}%
                        </span>
                        <span className="text-[10px] text-text-subtle">vs bln lalu</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-text-subtle">No comparison data</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div variants={itemVariants}>
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
      </motion.div>
    </motion.div>
  );
}

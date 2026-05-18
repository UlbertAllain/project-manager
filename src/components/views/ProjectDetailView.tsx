"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, Task, Transaction, Comment, ActivityLog } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
  PAYMENT_BADGE_CLASSES,
  PROJECT_STATUSES,
  LINK_PLATFORMS,
} from "@/lib/constants";
import {
  formatRupiah,
  formatDate,
  formatDateTime,
  getDeadlineStatus,
  getPlatformIcon,
  getLogIcon,
  recalculateProgress,
} from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Send,
  Link,
  FileText,
  DollarSign,
  MessageSquare,
  Activity,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetailView({
  projectId,
  onBack,
}: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuthStore();

  // Task form
  const [newTask, setNewTask] = useState("");

  // Transaction form
  const [txForm, setTxForm] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Comment form
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Attachment form
  const [attForm, setAttForm] = useState({
    title: "",
    url: "",
    platform: "Lainnya",
  });
  const [attSubmitting, setAttSubmitting] = useState(false);

  // Status change
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchProject();
  }, [fetchProject]);

  // --- Task handlers ---
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      const tasks = project?.tasks || [];
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: [
            ...tasks.map((t) => ({
              title: t.title,
              isCompleted: t.isCompleted,
              order: t.order,
            })),
            {
              title: newTask.trim(),
              isCompleted: false,
              order: tasks.length,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error();
      setNewTask("");
      fetchProject();
      toast.success("Task ditambahkan");
    } catch {
      toast.error("Gagal menambah task");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!project) return;
    const tasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    const progress = recalculateProgress(tasks);

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            title: t.title,
            isCompleted: t.isCompleted,
            order: t.order,
          })),
          progress,
        }),
      });
      fetchProject();
    } catch {
      toast.error("Gagal update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    const tasks = project.tasks.filter((t) => t.id !== taskId);
    const progress = recalculateProgress(tasks);

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((t, i) => ({
            title: t.title,
            isCompleted: t.isCompleted,
            order: i,
          })),
          progress,
        }),
      });
      fetchProject();
      toast.success("Task dihapus");
    } catch {
      toast.error("Gagal menghapus task");
    }
  };

  // --- Status change ---
  const handleStatusChange = async (newStatus: string) => {
    setStatusSubmitting(true);
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
      fetchProject();
      toast.success(`Status diubah ke ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Gagal mengubah status");
    } finally {
      setStatusSubmitting(false);
    }
  };

  // --- Transaction handlers ---
  const handleAddTransaction = async () => {
    if (!txForm.amount || !txForm.description) {
      toast.error("Amount dan keterangan wajib diisi");
      return;
    }
    setTxSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...txForm,
          amount: Number(txForm.amount),
          projectId,
        }),
      });
      if (!res.ok) throw new Error();
      setTxForm({
        type: "INCOME",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchProject();
      toast.success("Transaksi ditambahkan");
    } catch {
      toast.error("Gagal menambah transaksi");
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      fetchProject();
      toast.success("Transaksi dihapus");
    } catch {
      toast.error("Gagal menghapus transaksi");
    }
  };

  // --- Comment handler ---
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.email || "unknown",
          message: newComment.trim(),
          projectId,
        }),
      });
      if (!res.ok) throw new Error();
      setNewComment("");
      fetchProject();
      toast.success("Komentar ditambahkan");
    } catch {
      toast.error("Gagal menambah komentar");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // --- Attachment handler ---
  const handleAddAttachment = async () => {
    if (!attForm.title || !attForm.url) {
      toast.error("Judul dan URL wajib diisi");
      return;
    }
    setAttSubmitting(true);
    try {
      const currentAttachments = project?.attachments || [];
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: [
            ...currentAttachments.map((a) => ({
              title: a.title,
              url: a.url,
              platform: a.platform,
            })),
            {
              title: attForm.title,
              url: attForm.url,
              platform: attForm.platform,
            },
          ],
        }),
      });
      setAttForm({ title: "", url: "", platform: "Lainnya" });
      fetchProject();
      toast.success("Attachment ditambahkan");
    } catch {
      toast.error("Gagal menambah attachment");
    } finally {
      setAttSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-base-card rounded animate-pulse" />
        <div className="h-48 bg-base-card rounded-lg border border-base-border animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Project tidak ditemukan</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mt-2 text-brand-primary"
        >
          Kembali ke Projects
        </Button>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus(project.status, project.deadline);
  const paidPercent =
    project.budget > 0
      ? Math.round((project.paidAmount / project.budget) * 100)
      : 0;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded hover:bg-base-hover text-text-muted hover:text-text-main"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-text-main truncate">
            {project.projectName}
          </h1>
          <p className="text-sm text-text-muted">{project.clientName}</p>
        </div>
      </div>

      {/* Status & Info Bar */}
      <div className="bg-base-card border border-base-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Select
            value={project.status}
            onValueChange={handleStatusChange}
            disabled={statusSubmitting}
          >
            <SelectTrigger
              className={`h-7 w-36 text-xs ${STATUS_BADGE_CLASSES[project.status] || ""}`}
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

          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${PRIORITY_BADGE_CLASSES[project.priority] || ""}`}
          >
            {project.priority}
          </Badge>

          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          >
            {project.category}
          </Badge>

          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${PAYMENT_BADGE_CLASSES[project.paymentStatus] || ""}`}
          >
            {project.paymentStatus}
          </Badge>

          {deadlineStatus === "OVERDUE" && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-400 border-red-500/20"
            >
              Overdue
            </Badge>
          )}
        </div>

        {/* Progress + Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-muted">Progress</span>
              <span className="text-xs font-medium text-text-main">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-muted">Pembayaran</span>
              <span className="text-xs font-medium text-text-main">
                {formatRupiah(project.paidAmount)} /{" "}
                {formatRupiah(project.budget)}
              </span>
            </div>
            <Progress value={paidPercent} className="h-2" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[11px] text-text-subtle">
          {project.projectLead && (
            <span>Lead: {project.projectLead}</span>
          )}
          {project.startDate && <span>Mulai: {formatDate(project.startDate)}</span>}
          {project.deadline && (
            <span>Deadline: {formatDate(project.deadline)}</span>
          )}
          {project.completedDate && (
            <span>Selesai: {formatDate(project.completedDate)}</span>
          )}
        </div>

        {/* Tech stack */}
        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] rounded bg-base-hover text-text-muted border border-base-border"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {project.description && (
          <p className="text-sm text-text-muted mt-3">
            {project.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-base-card border border-base-border h-9 p-0.5">
          <TabsTrigger
            value="overview"
            className="text-xs h-8 data-[state=active]:bg-base-hover"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="finance"
            className="text-xs h-8 data-[state=active]:bg-base-hover"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Finance
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="text-xs h-8 data-[state=active]:bg-base-hover"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-xs h-8 data-[state=active]:bg-base-hover"
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="attachments"
            className="text-xs h-8 data-[state=active]:bg-base-hover"
          >
            <Paperclip className="w-3.5 h-3.5 mr-1" />
            Links
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab (Tasks) */}
        <TabsContent value="overview" className="mt-3">
          <div className="bg-base-card border border-base-border rounded-lg">
            <div className="p-4 border-b border-base-border">
              <h3 className="text-sm font-medium text-text-main">
                Tasks
                <span className="text-text-subtle font-normal ml-1.5">
                  ({project.tasks.filter((t) => t.isCompleted).length}/
                  {project.tasks.length})
                </span>
              </h3>
            </div>

            {/* Add task */}
            <div className="p-3 border-b border-base-border flex items-center gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Tambah task baru..."
                className="flex-1 h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!newTask.trim()}
                className="h-8 text-xs gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>

            {/* Task list */}
            <div className="divide-y divide-base-border max-h-96 overflow-y-auto">
              {project.tasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-subtle">
                  Belum ada task
                </div>
              ) : (
                project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-hover/30 group"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="shrink-0"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-text-subtle hover:text-text-muted" />
                      )}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.isCompleted
                          ? "line-through text-text-subtle"
                          : "text-text-main"
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-subtle hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          {project.notes && (
            <div className="bg-base-card border border-base-border rounded-lg mt-3 p-4">
              <h3 className="text-sm font-medium text-text-main mb-2">
                Notes
              </h3>
              <p className="text-sm text-text-muted whitespace-pre-wrap">
                {project.notes}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-3">
          <div className="bg-base-card border border-base-border rounded-lg">
            <div className="p-4 border-b border-base-border">
              <h3 className="text-sm font-medium text-text-main">
                Transaksi
              </h3>
            </div>

            {/* Add transaction form */}
            <div className="p-3 border-b border-base-border">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Select
                  value={txForm.type}
                  onValueChange={(v) =>
                    setTxForm({ ...txForm, type: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-base-bg border-base-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={txForm.amount}
                  onChange={(e) =>
                    setTxForm({ ...txForm, amount: e.target.value })
                  }
                  className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                />
                <input
                  type="text"
                  placeholder="Keterangan"
                  value={txForm.description}
                  onChange={(e) =>
                    setTxForm({ ...txForm, description: e.target.value })
                  }
                  className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                />
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) =>
                    setTxForm({ ...txForm, date: e.target.value })
                  }
                  className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main focus:outline-none focus:border-brand-primary"
                />
                <Button
                  size="sm"
                  onClick={handleAddTransaction}
                  disabled={txSubmitting}
                  className="h-8 text-xs gap-1"
                >
                  {txSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 border-b border-base-border flex gap-4 text-xs">
              <span className="text-emerald-400">
                Income: {formatRupiah(project.paidAmount)}
              </span>
              <span className="text-red-400">
                Expense: {formatRupiah(project.totalExpense)}
              </span>
              <span className="text-text-muted">
                Net: {formatRupiah(project.paidAmount - project.totalExpense)}
              </span>
            </div>

            {/* Transaction list */}
            <div className="divide-y divide-base-border max-h-96 overflow-y-auto">
              {project.transactions.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-subtle">
                  Belum ada transaksi
                </div>
              ) : (
                project.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-base-hover/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            tx.type === "INCOME"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}{" "}
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-text-subtle truncate">
                        {tx.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-subtle">
                        {formatDate(tx.date, {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-subtle hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-3">
          <div className="bg-base-card border border-base-border rounded-lg">
            <div className="p-4 border-b border-base-border">
              <h3 className="text-sm font-medium text-text-main">
                Comments ({project.comments.length})
              </h3>
            </div>

            {/* Add comment */}
            <div className="p-3 border-b border-base-border flex items-start gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis komentar..."
                rows={2}
                className="flex-1 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary resize-none p-2"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={commentSubmitting || !newComment.trim()}
                className="h-8 text-xs gap-1 mt-auto"
              >
                {commentSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-base-border max-h-96 overflow-y-auto">
              {project.comments.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-subtle">
                  Belum ada komentar
                </div>
              ) : (
                project.comments.map((c) => (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-brand-primary">
                        {c.userEmail}
                      </span>
                      <span className="text-[10px] text-text-subtle">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-3">
          <div className="bg-base-card border border-base-border rounded-lg">
            <div className="p-4 border-b border-base-border">
              <h3 className="text-sm font-medium text-text-main">
                Activity Log
              </h3>
            </div>
            <div className="divide-y divide-base-border max-h-96 overflow-y-auto">
              {project.logs.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-subtle">
                  Belum ada aktivitas
                </div>
              ) : (
                project.logs.map((log) => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">
                        {getLogIcon(log.action)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-muted">
                          {log.message}
                        </p>
                        <p className="text-[10px] text-text-subtle mt-0.5">
                          {formatDateTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="mt-3">
          <div className="bg-base-card border border-base-border rounded-lg">
            <div className="p-4 border-b border-base-border">
              <h3 className="text-sm font-medium text-text-main">
                Link Attachments
              </h3>
            </div>

            {/* Add attachment */}
            <div className="p-3 border-b border-base-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Judul link"
                  value={attForm.title}
                  onChange={(e) =>
                    setAttForm({ ...attForm, title: e.target.value })
                  }
                  className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={attForm.url}
                  onChange={(e) =>
                    setAttForm({ ...attForm, url: e.target.value })
                  }
                  className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
                />
                <Select
                  value={attForm.platform}
                  onValueChange={(v) =>
                    setAttForm({ ...attForm, platform: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-base-bg border-base-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddAttachment}
                  disabled={attSubmitting}
                  className="h-8 text-xs gap-1"
                >
                  {attSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add
                </Button>
              </div>
            </div>

            {/* Attachment list */}
            <div className="divide-y divide-base-border">
              {project.attachments.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-subtle">
                  Belum ada attachment
                </div>
              ) : (
                project.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-hover/30"
                  >
                    <span className="text-sm">
                      {getPlatformIcon(att.platform)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-main truncate">
                        {att.title}
                      </p>
                      <p className="text-[11px] text-text-subtle truncate">
                        {att.url}
                      </p>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-base-hover text-text-subtle hover:text-brand-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";
import { recalculateProgress } from "@/lib/helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  DollarSign,
  MessageSquare,
  Activity,
  Paperclip,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { useProject, useUpdateProjectMutation } from "@/hooks/useProject";
import { useCreateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useCreateComment } from "@/hooks/useComments";

// Decomposed components
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { TaskSection } from "@/components/project/TaskSection";
import { FinanceSection } from "@/components/project/FinanceSection";
import { CommentSection } from "@/components/project/CommentSection";
import { ActivitySection } from "@/components/project/ActivitySection";
import { AttachmentSection } from "@/components/project/AttachmentSection";
import { DeleteConfirmDialog } from "@/components/project/DeleteConfirmDialog";

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetailView({
  projectId,
  onBack,
}: ProjectDetailViewProps) {
  const { data: project, isLoading: loading } = useProject(projectId);
  const updateProjectMutation = useUpdateProjectMutation(projectId);
  const createTransactionMutation = useCreateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const createCommentMutation = useCreateComment();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState("overview");

  // Task form
  const [newTask, setNewTask] = useState("");

  // Transaction form
  const [txForm, setTxForm] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Comment form
  const [newComment, setNewComment] = useState("");

  // Attachment form
  const [attForm, setAttForm] = useState({
    title: "",
    url: "",
    platform: "Lainnya",
  });
  const [attSubmitting, setAttSubmitting] = useState(false);

  // Status change
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "task" | "transaction";
    id: string;
  } | null>(null);

  // --- Task handlers ---
  const handleAddTask = async () => {
    if (!newTask.trim() || !project) return;
    try {
      const tasks = project.tasks || [];
      await updateProjectMutation.mutateAsync({
        id: projectId,
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
      });
      setNewTask("");
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
      await updateProjectMutation.mutateAsync({
        id: projectId,
        tasks: tasks.map((t) => ({
          title: t.title,
          isCompleted: t.isCompleted,
          order: t.order,
        })),
        progress,
      });
    } catch {
      toast.error("Gagal update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    const tasks = project.tasks.filter((t) => t.id !== taskId);
    const progress = recalculateProgress(tasks);

    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        tasks: tasks.map((t, i) => ({
          title: t.title,
          isCompleted: t.isCompleted,
          order: i,
        })),
        progress,
      });
      toast.success("Task dihapus");
    } catch {
      toast.error("Gagal menghapus task");
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Status change ---
  const handleStatusChange = async (newStatus: string) => {
    setStatusSubmitting(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus, id: projectId };
      if (newStatus === "COMPLETED") {
        updateData.progress = 100;
        updateData.completedDate = new Date().toISOString();
      }
      await updateProjectMutation.mutateAsync(updateData);
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
    try {
      await createTransactionMutation.mutateAsync({
        ...txForm,
        amount: Number(txForm.amount),
        projectId,
      });
      setTxForm({
        type: "INCOME",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Transaksi ditambahkan");
    } catch {
      toast.error("Gagal menambah transaksi");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransactionMutation.mutateAsync(id);
      toast.success("Transaksi dihapus");
    } catch {
      toast.error("Gagal menghapus transaksi");
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Comment handler ---
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createCommentMutation.mutateAsync({
        userEmail: user?.email || "unknown",
        message: newComment.trim(),
        projectId,
      });
      setNewComment("");
      toast.success("Komentar ditambahkan");
    } catch {
      toast.error("Gagal menambah komentar");
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
      await updateProjectMutation.mutateAsync({
        id: projectId,
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
      });
      setAttForm({ title: "", url: "", platform: "Lainnya" });
      toast.success("Attachment ditambahkan");
    } catch {
      toast.error("Gagal menambah attachment");
    } finally {
      setAttSubmitting(false);
    }
  };

  // --- Delete confirm handler ---
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "task") {
      handleDeleteTask(deleteTarget.id);
    } else if (deleteTarget.type === "transaction") {
      handleDeleteTransaction(deleteTarget.id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-base-card rounded animate-pulse" />
          <div className="h-6 w-48 bg-base-card rounded animate-pulse" />
        </div>
        <div className="h-64 bg-base-card rounded-lg border border-base-border animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Project tidak ditemukan</p>
        <button
          onClick={onBack}
          className="mt-2 text-sm text-brand-primary hover:underline"
        >
          Kembali ke Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <ProjectHeader
        project={project}
        onBack={onBack}
        onStatusChange={handleStatusChange}
        statusSubmitting={statusSubmitting}
      />

      {/* Notes (if any) - shown above tabs */}
      {project.notes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-base-card border border-base-border rounded-lg p-4"
        >
          <h3 className="text-sm font-medium text-text-main mb-2">Notes</h3>
          <p className="text-sm text-text-muted whitespace-pre-wrap">
            {project.notes}
          </p>
        </motion.div>
      )}

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

        <TabsContent value="overview" className="mt-3">
          <TaskSection
            tasks={project.tasks}
            newTask={newTask}
            onNewTaskChange={setNewTask}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={(id) => setDeleteTarget({ type: "task", id })}
          />
        </TabsContent>

        <TabsContent value="finance" className="mt-3">
          <FinanceSection
            transactions={project.transactions}
            paidAmount={project.paidAmount}
            totalExpense={project.totalExpense}
            budget={project.budget}
            txForm={txForm}
            onTxFormChange={setTxForm}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={(id) =>
              setDeleteTarget({ type: "transaction", id })
            }
            txSubmitting={createTransactionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-3">
          <CommentSection
            comments={project.comments}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={handleAddComment}
            commentSubmitting={createCommentMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-3">
          <ActivitySection logs={project.logs} />
        </TabsContent>

        <TabsContent value="attachments" className="mt-3">
          <AttachmentSection
            attachments={project.attachments}
            attForm={attForm}
            onAttFormChange={setAttForm}
            onAddAttachment={handleAddAttachment}
            attSubmitting={attSubmitting}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={
          deleteTarget?.type === "task"
            ? "Hapus Task"
            : "Hapus Transaksi"
        }
        description={
          deleteTarget?.type === "task"
            ? "Yakin ingin menghapus task ini? Tindakan ini tidak dapat dibatalkan."
            : "Yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

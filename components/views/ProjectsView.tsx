"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Project } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
  CATEGORIES,
  PRIORITIES,
  PROJECT_STATUSES,
} from "@/lib/constants";
import {
  formatRupiah,
  formatDate,
  getDeadlineStatus,
  formatBudgetShort,
} from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  FolderKanban,
  Download,
  FileUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportProjectsCSV } from "@/lib/utils/exportCsv";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmDialog } from "@/components/project/DeleteConfirmDialog";
import { ImportDialog } from "@/components/import/ImportDialog";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectCardSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectsViewProps {
  onSelectProject: (id: string) => void;
}

const emptyForm = {
  projectName: "",
  clientName: "",
  projectLead: "",
  description: "",
  status: "NEW",
  priority: "MEDIUM",
  category: "WEB",
  techStack: "",
  startDate: "",
  deadline: "",
  budget: "",
  notes: "",
};

// Extracted OUTSIDE the component to avoid re-creation on every render
function ProjectFormFields({ form, setForm }: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
}) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Nama Project *
          </label>
          <Input
            value={form.projectName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, projectName: e.target.value }))
            }
            placeholder="Nama project"
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Nama Client *
          </label>
          <Input
            value={form.clientName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, clientName: e.target.value }))
            }
            placeholder="Nama client"
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Project Lead
          </label>
          <Input
            value={form.projectLead}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, projectLead: e.target.value }))
            }
            placeholder="Project lead"
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Budget (Rp)
          </label>
          <Input
            type="number"
            value={form.budget}
            onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
            placeholder="0"
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">Status</label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
          >
            <SelectTrigger className="h-8 text-sm bg-base-bg border-base-border">
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
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Priority
          </label>
          <Select
            value={form.priority}
            onValueChange={(v) => setForm((prev) => ({ ...prev, priority: v }))}
          >
            <SelectTrigger className="h-8 text-sm bg-base-bg border-base-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Category
          </label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger className="h-8 text-sm bg-base-bg border-base-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Deadline
          </label>
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deadline: e.target.value }))
            }
            className="h-8 text-sm bg-base-bg border-base-border"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">
          Tech Stack (comma-separated)
        </label>
        <Input
          value={form.techStack}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, techStack: e.target.value }))
          }
          placeholder="Next.js, TypeScript, Firebase"
          className="h-8 text-sm bg-base-bg border-base-border"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">
          Description
        </label>
        <Textarea
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Deskripsi project..."
          rows={2}
          className="text-sm bg-base-bg border-base-border resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Notes</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Catatan tambahan..."
          rows={2}
          className="text-sm bg-base-bg border-base-border resize-none"
        />
      </div>
    </div>
  );
}

export function ProjectsView({ onSelectProject }: ProjectsViewProps) {
  const { data: projects = [], isLoading: loading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  }, []);

  // Form state
  const [form, setForm] = useState(emptyForm);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
  }, []);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setShowCreateDialog(true);
  }, [resetForm]);

  const openEditDialog = useCallback((project: Project) => {
    setEditingProject(project);
    setForm({
      projectName: project.projectName,
      clientName: project.clientName,
      projectLead: project.projectLead,
      description: project.description,
      status: project.status,
      priority: project.priority,
      category: project.category,
      techStack: project.techStack.join(", "),
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      deadline: project.deadline ? project.deadline.split("T")[0] : "",
      budget: String(project.budget),
      notes: project.notes,
    });
    setShowEditDialog(true);
  }, []);

  const handleCreate = async () => {
    if (!form.projectName || !form.clientName) {
      toast.error("Nama project dan client wajib diisi");
      return;
    }

    try {
      await createProject.mutateAsync({
        projectName: form.projectName,
        clientName: form.clientName,
        projectLead: form.projectLead,
        description: form.description,
        status: form.status,
        priority: form.priority,
        category: form.category,
        techStack: form.techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
        budget: Number(form.budget) || 0,
        notes: form.notes,
      });
      toast.success("Project berhasil dibuat!");
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan server"
      );
    }
  };

  const handleUpdate = async () => {
    if (!editingProject) return;

    try {
      await updateProject.mutateAsync({
        id: editingProject.id,
        projectName: form.projectName,
        clientName: form.clientName,
        projectLead: form.projectLead,
        description: form.description,
        status: form.status,
        priority: form.priority,
        category: form.category,
        techStack: form.techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
        budget: Number(form.budget) || 0,
        notes: form.notes,
      });
      toast.success("Project berhasil diupdate!");
      setShowEditDialog(false);
      setEditingProject(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan server"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project berhasil dihapus");
    } catch {
      toast.error("Terjadi kesalahan server");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Filter with debounce
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !debouncedSearch ||
        p.projectName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.clientName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, debouncedSearch, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div>
          <Skeleton className="h-6 w-28 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Projects</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {projects.length} project total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-text-muted hover:text-text-main"
            onClick={() => setShowImportDialog(true)}
          >
            <FileUp className="w-3.5 h-3.5" />
            Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-text-muted hover:text-text-main"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (filtered.length === 0) {
                    toast.error("Tidak ada data untuk diexport");
                    return;
                  }
                  exportProjectsCSV(filtered);
                  toast.success("Data project berhasil diexport");
                }}
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari project..."
            className="w-full h-8 pl-8 pr-3 text-sm bg-base-card border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
          {search !== debouncedSearch && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3 h-3 animate-spin text-text-subtle" />
            </div>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs bg-base-card border-base-border">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-text-subtle" />
          </div>
          <p className="text-sm text-text-subtle">
            {debouncedSearch || statusFilter !== "ALL"
              ? "Tidak ada project yang cocok dengan filter"
              : "Belum ada project"}
          </p>
          <p className="text-xs text-text-subtle mt-1">
            {debouncedSearch || statusFilter !== "ALL"
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Buat project pertama untuk memulai"}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => {
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
                  className="bg-base-card border border-base-border rounded-lg p-4 hover:border-base-border/80 transition-colors cursor-pointer group"
                  onClick={() => onSelectProject(project.id)}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-text-main truncate group-hover:text-brand-primary transition-colors">
                        {project.projectName}
                      </h3>
                      <p className="text-xs text-text-muted truncate">
                        {project.clientName}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1 rounded hover:bg-base-hover text-text-subtle hover:text-text-main opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(project.id);
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(project);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(project.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE_CLASSES[project.status] || ""}`}
                    >
                      {STATUS_LABELS[project.status] || project.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${PRIORITY_BADGE_CLASSES[project.priority] || ""}`}
                    >
                      {project.priority}
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

                  {/* Progress */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-text-subtle">
                        Progress
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-text-subtle">
                    <span>
                      {project.budget > 0
                        ? formatBudgetShort(project.budget)
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
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-base-card border-base-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-main text-base">
              Buat Project Baru
            </DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateDialog(false)}
              className="text-text-muted"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createProject.isPending}
              className="gap-1.5"
            >
              {createProject.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Buat Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingProject(null);
        }}
      >
        <DialogContent className="bg-base-card border-base-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-main text-base">
              Edit Project
            </DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEditDialog(false);
                setEditingProject(null);
              }}
              className="text-text-muted"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={updateProject.isPending}
              className="gap-1.5"
            >
              {updateProject.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Project"
        description="Yakin ingin menghapus project ini? Semua data termasuk tasks, transaksi, dan komentar akan ikut terhapus. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}
      />
    </div>
  );
}

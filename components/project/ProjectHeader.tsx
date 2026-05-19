"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_BADGE_CLASSES,
  PAYMENT_BADGE_CLASSES,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Copy, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onStatusChange: (status: string) => void;
  statusSubmitting: boolean;
  onDuplicate?: () => void;
  duplicateLoading?: boolean;
  coverImage?: string | null;
  onGenerateCover?: (prompt?: string) => void;
  coverLoading?: boolean;
}

export function ProjectHeader({
  project,
  onBack,
  onStatusChange,
  statusSubmitting,
  onDuplicate,
  duplicateLoading,
  coverImage,
  onGenerateCover,
  coverLoading,
}: ProjectHeaderProps) {
  const deadlineStatus = getDeadlineStatus(project.status, project.deadline);
  const paidPercent =
    project.budget > 0
      ? Math.round((project.paidAmount / project.budget) * 100)
      : 0;

  // Cover generation popover state
  const [coverPrompt, setCoverPrompt] = useState("");
  const [coverPopoverOpen, setCoverPopoverOpen] = useState(false);

  const handleGenerate = () => {
    if (onGenerateCover) {
      onGenerateCover(coverPrompt.trim() || undefined);
      setCoverPopoverOpen(false);
      setCoverPrompt("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Cover Image Banner */}
      <div className="relative w-full h-32 md:h-40 rounded-lg overflow-hidden">
        {coverImage ? (
          <img
            src={`data:image/png;base64,${coverImage}`}
            alt="Project cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 via-brand-primary/5 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-bg/80 to-transparent" />
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded hover:bg-base-hover text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-text-main truncate">
            {project.projectName}
          </h1>
          <p className="text-sm text-text-muted">{project.clientName}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Cover Button */}
          {onGenerateCover && (
          <Popover
            open={coverPopoverOpen}
            onOpenChange={setCoverPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={coverLoading}
                className="h-8 gap-1.5 text-text-muted hover:text-text-main"
                title="Generate AI Cover"
              >
                {coverLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">AI Cover</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 bg-base-card border-base-border"
              align="end"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-text-main">
                    Generate AI Cover
                  </h4>
                  <p className="text-xs text-text-muted">
                    Buat cover image otomatis berdasarkan data project, atau
                    masukkan custom prompt.
                  </p>
                </div>
                <Input
                  placeholder="Custom prompt (opsional)..."
                  value={coverPrompt}
                  onChange={(e) => setCoverPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate();
                  }}
                  className="h-8 text-xs bg-base-hover border-base-border"
                  disabled={coverLoading}
                />
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={coverLoading}
                  className="w-full h-8 text-xs gap-1.5"
                >
                  {coverLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {coverLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {onDuplicate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={duplicateLoading}
            className="h-8 gap-1.5 text-text-muted hover:text-text-main"
            title="Duplikasi Project"
          >
            {duplicateLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-xs">Duplikasi</span>
          </Button>
        )}
        </div>
      </div>

      {/* Status & Info Bar */}
      <div className="bg-base-card border border-base-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Select
            value={project.status}
            onValueChange={onStatusChange}
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
          {deadlineStatus === "WARNING" && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20"
            >
              Deadline Mendekat
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
    </motion.div>
  );
}

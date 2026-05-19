// ==================== SHARED CONSTANTS ====================
// Centralized — no more duplication across components

export const PROJECT_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "FINISHING",
  "REVIEW",
  "REVISION",
  "ON_HOLD",
  "CANCELLED",
  "COMPLETED",
] as const;

export const ACTIVE_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "FINISHING",
  "REVIEW",
  "REVISION",
  "ON_HOLD",
] as const;

export const BOARD_COLUMNS = [
  "NEW",
  "IN_PROGRESS",
  "FINISHING",
  "REVIEW",
  "REVISION",
  "ON_HOLD",
  "COMPLETED",
] as const;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const CATEGORIES = [
  "WEB",
  "MOBILE",
  "DESIGN",
  "JOKI SKRIPSI",
  "CONSULTING",
  "MAINTENANCE",
  "LAINNYA",
] as const;

export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;

export const LINK_PLATFORMS = [
  "Google Drive",
  "Figma",
  "GitHub",
  "Dropbox",
  "Lainnya",
] as const;

// Status → Label mapping (human readable)
export const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  FINISHING: "Finishing",
  REVIEW: "Review",
  REVISION: "Revision",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

// Status → Color mapping for dots/badges
export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  FINISHING: "bg-purple-500",
  REVIEW: "bg-sky-400",
  REVISION: "bg-orange-400",
  ON_HOLD: "bg-zinc-500",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-emerald-500",
};

// Status → Badge variant class
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  FINISHING: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  REVIEW: "bg-sky-400/10 text-sky-400 border-sky-400/20",
  REVISION: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  ON_HOLD: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// Priority → Badge class
export const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  LOW: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  URGENT: "bg-red-500/10 text-red-400 border-red-500/20",
};

// Payment → Badge class
export const PAYMENT_BADGE_CLASSES: Record<string, string> = {
  UNPAID: "bg-red-500/10 text-red-400 border-red-500/20",
  PARTIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// Kanban column header colors
export const COLUMN_HEADER_CLASSES: Record<string, string> = {
  NEW: "bg-blue-600",
  IN_PROGRESS: "bg-amber-600",
  FINISHING: "bg-purple-600",
  REVIEW: "bg-sky-600",
  REVISION: "bg-orange-600",
  ON_HOLD: "bg-zinc-600",
  COMPLETED: "bg-emerald-600",
};

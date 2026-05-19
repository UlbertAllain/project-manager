// ==================== SHARED HELPERS ====================
// Centralized — no more duplication across components

import { PROJECT_STATUSES } from "@/lib/constants";

// ---------- Deadline Status ----------
export type DeadlineStatus = "SAFE" | "WARNING" | "OVERDUE";

export function getDeadlineStatus(
  status: string,
  deadline: string | null
): DeadlineStatus {
  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    !deadline
  )
    return "SAFE";
  const diffDays =
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 3) return "WARNING";
  return "SAFE";
}

// ---------- Auto Status from Progress ----------
export function getAutoStatus(progress: number): string {
  if (progress === 0) return "NEW";
  if (progress > 0 && progress < 75) return "IN_PROGRESS";
  if (progress >= 75 && progress < 100) return "FINISHING";
  if (progress === 100) return "COMPLETED";
  return "NEW";
}

// ---------- Recalculate Progress from Tasks ----------
export function recalculateProgress(tasks: { isCompleted: boolean }[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.isCompleted).length;
  return Math.round((completed / tasks.length) * 100);
}

// ---------- Format Currency ----------
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ---------- Format Number Input (thousand separator) ----------
export function formatNumberInput(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------- Parse Formatted Number ----------
export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/\./g, "").replace(/\D/g, "")) || 0;
}

// ---------- Format Date ----------
export function formatDate(
  isoString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString(
    "id-ID",
    options ?? { day: "numeric", month: "long", year: "numeric" }
  );
}

// ---------- Format Date Short ----------
export function formatDateShort(
  isoString: string | null | undefined
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// ---------- Format DateTime ----------
export function formatDateTime(
  isoString: string | null | undefined
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- Platform Icon ----------
export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case "Google Drive":
      return "📁";
    case "Figma":
      return "🎨";
    case "GitHub":
      return "💻";
    case "Dropbox":
      return "📦";
    default:
      return "🔗";
  }
}

// ---------- Log Icon ----------
export function getLogIcon(action: string): string {
  switch (action) {
    case "CREATED":
      return "🟢";
    case "STATUS_CHANGED":
      return "🔄";
    case "PAYMENT_CHANGED":
      return "💰";
    case "DELETED":
      return "🔴";
    default:
      return "🔵";
  }
}

// ---------- Budget Display Short ----------
export function formatBudgetShort(budget: number): string {
  if (budget <= 0) return "-";
  if (budget >= 1_000_000) return `${(budget / 1_000_000).toFixed(0)}jt`;
  return formatRupiah(budget);
}

// ---------- Relative Time (Indonesian) ----------
export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return formatDate(dateString, { day: "numeric", month: "short" });
}

// ---------- Days Remaining Until Deadline ----------
export function getDaysRemaining(deadline: string): number {
  const diff =
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

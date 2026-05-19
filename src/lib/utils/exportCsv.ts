import { Project, Transaction } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

// ---------- CSV Helpers ----------

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateForCSV(
  isoString: string | null | undefined
): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function triggerDownload(csvContent: string, filename: string): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------- Export Projects CSV ----------

export function exportProjectsCSV(projects: Project[]): void {
  if (projects.length === 0) return;

  const headers = [
    "Nama Project",
    "Client",
    "Lead",
    "Status",
    "Priority",
    "Category",
    "Budget",
    "Paid",
    "Expense",
    "Progress",
    "Start Date",
    "Deadline",
    "Tech Stack",
  ];

  const rows = projects.map((p) =>
    [
      escapeCSVField(p.projectName),
      escapeCSVField(p.clientName),
      escapeCSVField(p.projectLead),
      escapeCSVField(STATUS_LABELS[p.status] || p.status),
      escapeCSVField(p.priority),
      escapeCSVField(p.category),
      String(p.budget),
      String(p.paidAmount),
      String(p.totalExpense),
      `${p.progress}%`,
      formatDateForCSV(p.startDate),
      formatDateForCSV(p.deadline),
      escapeCSVField(p.techStack.join(", ")),
    ].join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const filename = `nextylabs-projects-${getTodayDateString()}.csv`;
  triggerDownload(csvContent, filename);
}

// ---------- Export Transactions CSV ----------

export function exportTransactionsCSV(
  transactions: Transaction[],
  projects?: Project[]
): void {
  if (transactions.length === 0) return;

  const projectMap = new Map<string, string>();
  if (projects) {
    for (const p of projects) {
      projectMap.set(p.id, p.projectName);
    }
  }

  const headers = [
    "Tanggal",
    "Tipe",
    "Jumlah",
    "Keterangan",
    "Project",
  ];

  const rows = transactions.map((t) => {
    const projectName =
      t.project?.projectName || projectMap.get(t.projectId) || "Unknown";
    return [
      formatDateForCSV(t.date),
      escapeCSVField(t.type === "INCOME" ? "Income" : "Expense"),
      String(t.amount),
      escapeCSVField(t.description),
      escapeCSVField(projectName),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const filename = `nextylabs-transactions-${getTodayDateString()}.csv`;
  triggerDownload(csvContent, filename);
}

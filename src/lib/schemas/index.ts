// ==================== ZOD VALIDATION SCHEMAS ====================
// All API input validation in one place

import { z } from "zod";

// ---------- Project Schemas ----------
export const createProjectSchema = z.object({
  projectName: z.string().min(1, "Nama project wajib diisi"),
  clientName: z.string().min(1, "Nama client wajib diisi"),
  projectLead: z.string().default(""),
  description: z.string().default(""),
  status: z
    .enum([
      "NEW",
      "IN_PROGRESS",
      "FINISHING",
      "REVIEW",
      "REVISION",
      "ON_HOLD",
      "CANCELLED",
      "COMPLETED",
    ])
    .default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z
    .enum([
      "WEB",
      "MOBILE",
      "DESIGN",
      "JOKI SKRIPSI",
      "CONSULTING",
      "MAINTENANCE",
      "LAINNYA",
    ])
    .default("WEB"),
  techStack: z.array(z.string()).default([]),
  startDate: z.string().default(""),
  deadline: z.string().default(""),
  completedDate: z.string().nullable().default(null),
  budget: z.number().min(0).default(0),
  notes: z.string().default(""),
});

export const updateProjectSchema = z.object({
  projectName: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  projectLead: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum([
      "NEW",
      "IN_PROGRESS",
      "FINISHING",
      "REVIEW",
      "REVISION",
      "ON_HOLD",
      "CANCELLED",
      "COMPLETED",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  completedDate: z.string().nullable().optional(),
  budget: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  totalExpense: z.number().min(0).optional(),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// ---------- Task Schema ----------
export const taskSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi"),
  isCompleted: z.boolean().default(false),
});

// ---------- Link Attachment Schema ----------
export const linkAttachmentSchema = z.object({
  title: z.string().min(1, "Judul link wajib diisi"),
  url: z.string().min(1, "URL wajib diisi"),
  platform: z.string().default("Lainnya"),
});

// ---------- Transaction Schema ----------
export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Keterangan wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
});

export const updateTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

// ---------- Comment Schema ----------
export const commentSchema = z.object({
  userEmail: z.string().min(1),
  message: z.string().min(1, "Komentar tidak boleh kosong"),
});

// ---------- Activity Log Schema ----------
export const activityLogSchema = z.object({
  action: z.enum([
    "CREATED",
    "UPDATED",
    "DELETED",
    "STATUS_CHANGED",
    "PAYMENT_CHANGED",
  ]),
  message: z.string().min(1),
});

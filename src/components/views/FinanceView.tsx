"use client";

import { useState, useEffect } from "react";
import { Transaction, Project } from "@/lib/types";
import { PAYMENT_BADGE_CLASSES, STATUS_LABELS } from "@/lib/constants";
import { formatRupiah, formatDate } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export function FinanceView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, projRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/projects"),
      ]);
      const txData = await txRes.json();
      const projData = await projRes.json();
      setTransactions(txData.data || []);
      setProjects(projData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Filtered transactions
  const filtered =
    projectFilter === "ALL"
      ? transactions
      : transactions.filter((t) => t.projectId === projectFilter);

  // Project budget summary
  const projectBudgets = projects.map((p) => ({
    id: p.id,
    name: p.projectName,
    budget: p.budget,
    paid: p.paidAmount,
    expense: p.totalExpense,
    paymentStatus: p.paymentStatus,
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-base-card rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-base-card rounded-lg border border-base-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-text-main">Finance</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Overview keuangan semua project
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">
              Total Income
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className="text-lg font-semibold text-emerald-400">
            {formatRupiah(totalIncome)}
          </p>
        </div>

        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">
              Total Expense
            </span>
            <div className="w-7 h-7 rounded-md bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>
          <p className="text-lg font-semibold text-red-400">
            {formatRupiah(totalExpense)}
          </p>
        </div>

        <div className="bg-base-card border border-base-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">
              Net Profit
            </span>
            <div className="w-7 h-7 rounded-md bg-brand-primary/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-brand-primary" />
            </div>
          </div>
          <p
            className={`text-lg font-semibold ${
              netProfit >= 0 ? "text-text-main" : "text-red-400"
            }`}
          >
            {formatRupiah(netProfit)}
          </p>
        </div>
      </div>

      {/* Project Budget Overview */}
      <div className="bg-base-card border border-base-border rounded-lg">
        <div className="p-4 border-b border-base-border">
          <h3 className="text-sm font-medium text-text-main">
            Budget per Project
          </h3>
        </div>
        <div className="divide-y divide-base-border max-h-64 overflow-y-auto">
          {projectBudgets.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-subtle">
              Belum ada project
            </div>
          ) : (
            projectBudgets.map((pb) => (
              <div
                key={pb.id}
                className="px-4 py-3 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-text-main truncate">
                      {pb.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${PAYMENT_BADGE_CLASSES[pb.paymentStatus] || ""}`}
                    >
                      {pb.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">
                      Paid: {formatRupiah(pb.paid)}
                    </span>
                    <span className="text-red-400">
                      Expense: {formatRupiah(pb.expense)}
                    </span>
                    <span className="text-text-subtle">
                      Budget: {formatRupiah(pb.budget)}
                    </span>
                  </div>
                </div>
                <div className="w-24">
                  <div className="flex items-center justify-between text-[10px] text-text-subtle mb-0.5">
                    <span>Payment</span>
                    <span>
                      {pb.budget > 0
                        ? `${Math.round((pb.paid / pb.budget) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-base-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full"
                      style={{
                        width: `${pb.budget > 0 ? (pb.paid / pb.budget) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-base-card border border-base-border rounded-lg">
        <div className="p-4 border-b border-base-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-main">
            Semua Transaksi
          </h3>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-7 w-44 text-xs bg-base-bg border-base-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y divide-base-border max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-subtle">
              Tidak ada transaksi
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-base-hover/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      tx.type === "INCOME"
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    {tx.type === "INCOME" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-text-main truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-text-subtle truncate">
                      {tx.project?.projectName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p
                    className={`text-sm font-medium ${
                      tx.type === "INCOME"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}{" "}
                    {formatRupiah(tx.amount)}
                  </p>
                  <p className="text-[10px] text-text-subtle">
                    {formatDate(tx.date, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

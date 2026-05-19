"use client";

import { Transaction } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FinanceSectionProps {
  transactions: Transaction[];
  paidAmount: number;
  totalExpense: number;
  budget: number;
  txForm: {
    type: string;
    amount: string;
    description: string;
    date: string;
  };
  onTxFormChange: (form: { type: string; amount: string; description: string; date: string }) => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  txSubmitting: boolean;
}

export function FinanceSection({
  transactions,
  paidAmount,
  totalExpense,
  budget,
  txForm,
  onTxFormChange,
  onAddTransaction,
  onDeleteTransaction,
  txSubmitting,
}: FinanceSectionProps) {
  const netAmount = paidAmount - totalExpense;

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-base-card border border-base-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-text-muted">Income</span>
          </div>
          <p className="text-sm font-semibold text-emerald-400">
            {formatRupiah(paidAmount)}
          </p>
        </div>
        <div className="bg-base-card border border-base-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownRight className="w-3 h-3 text-red-400" />
            <span className="text-[11px] text-text-muted">Expense</span>
          </div>
          <p className="text-sm font-semibold text-red-400">
            {formatRupiah(totalExpense)}
          </p>
        </div>
        <div className="bg-base-card border border-base-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] text-text-muted">Net</span>
          </div>
          <p className={`text-sm font-semibold ${netAmount >= 0 ? "text-text-main" : "text-red-400"}`}>
            {formatRupiah(netAmount)}
          </p>
        </div>
      </div>

      {/* Add transaction form */}
      <div className="bg-base-card border border-base-border rounded-lg">
        <div className="p-3 border-b border-base-border">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select
              value={txForm.type}
              onValueChange={(v) => onTxFormChange({ ...txForm, type: v })}
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
              onChange={(e) => onTxFormChange({ ...txForm, amount: e.target.value })}
              className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
            />
            <input
              type="text"
              placeholder="Keterangan"
              value={txForm.description}
              onChange={(e) => onTxFormChange({ ...txForm, description: e.target.value })}
              className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
            />
            <input
              type="date"
              value={txForm.date}
              onChange={(e) => onTxFormChange({ ...txForm, date: e.target.value })}
              className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main focus:outline-none focus:border-brand-primary"
            />
            <Button
              size="sm"
              onClick={onAddTransaction}
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

        {/* Transaction list */}
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence initial={false}>
            {transactions.length === 0 ? (
              <EmptyTransactionState />
            ) : (
              transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-base-hover/30 group border-b border-base-border last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        tx.type === "INCOME" ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {tx.type === "INCOME" ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs font-medium ${
                          tx.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"} {formatRupiah(tx.amount)}
                      </span>
                      <p className="text-xs text-text-subtle truncate">
                        {tx.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-subtle">
                      {formatDate(tx.date, { day: "numeric", month: "short" })}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-subtle hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EmptyTransactionState() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
        <ArrowUpRight className="w-5 h-5 text-text-subtle" />
      </div>
      <p className="text-sm text-text-subtle">Belum ada transaksi</p>
      <p className="text-xs text-text-subtle mt-1">
        Catat pemasukan dan pengeluaran project
      </p>
    </div>
  );
}

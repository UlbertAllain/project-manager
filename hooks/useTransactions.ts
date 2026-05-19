"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@/lib/types";
import { getSocket } from "@/lib/socket";

async function fetchTransactions(
  projectId?: string
): Promise<Transaction[]> {
  const url = projectId
    ? `/api/transactions?projectId=${projectId}`
    : "/api/transactions";
  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

async function createTransaction(payload: Record<string, unknown>) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Gagal menambah transaksi");
  }
  return res.json();
}

async function deleteTransaction(id: string) {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Gagal menghapus transaksi");
  }
  return res.json();
}

export function useTransactions(projectId?: string) {
  return useQuery({
    queryKey: ["transactions", projectId],
    queryFn: () => fetchTransactions(projectId),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      const projectId = variables.projectId as string | undefined;
      getSocket()?.emit("data-changed", {
        entity: "transaction",
        id: projectId,
      });
      getSocket()?.emit("activity", {
        type: "TRANSACTION_ADDED",
        projectId,
        message: "Transaction added",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      getSocket()?.emit("data-changed", { entity: "transaction" });
      getSocket()?.emit("activity", {
        type: "TRANSACTION_ADDED",
        message: "Transaction deleted",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

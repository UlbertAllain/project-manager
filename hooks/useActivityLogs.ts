"use client";

import { useQuery } from "@tanstack/react-query";

interface GlobalActivityLog {
  id: string;
  action: string;
  message: string;
  projectId: string;
  timestamp: string;
  project: {
    projectName: string;
    id: string;
  };
}

async function fetchGlobalLogs(): Promise<GlobalActivityLog[]> {
  const res = await fetch("/api/logs");
  const data = await res.json();
  return data.data || [];
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ["global-logs"],
    queryFn: fetchGlobalLogs,
    staleTime: 30_000,
  });
}

export type { GlobalActivityLog };

"use client";

import { ActivityLog } from "@/lib/types";
import { formatDateTime, getLogIcon } from "@/lib/helpers";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

interface ActivitySectionProps {
  logs: ActivityLog[];
}

export function ActivitySection({ logs }: ActivitySectionProps) {
  return (
    <div className="bg-base-card border border-base-border rounded-lg">
      <div className="p-4 border-b border-base-border">
        <h3 className="text-sm font-medium text-text-main">Activity Log</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-4 bottom-4 w-px bg-base-border" />
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                className="px-4 py-3 relative"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-base-hover border border-base-border flex items-center justify-center text-[10px] shrink-0 z-10 relative">
                    {getLogIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-muted">{log.message}</p>
                    <p className="text-[10px] text-text-subtle mt-0.5">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyActivityState() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
        <Activity className="w-5 h-5 text-text-subtle" />
      </div>
      <p className="text-sm text-text-subtle">Belum ada aktivitas</p>
      <p className="text-xs text-text-subtle mt-1">
        Aktivitas akan tercatat otomatis
      </p>
    </div>
  );
}

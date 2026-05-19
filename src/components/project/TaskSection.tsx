"use client";

import { Task } from "@/lib/types";
import { recalculateProgress } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskSectionProps {
  tasks: Task[];
  newTask: string;
  onNewTaskChange: (val: string) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskSection({
  tasks,
  newTask,
  onNewTaskChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskSectionProps) {
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="bg-base-card border border-base-border rounded-lg">
      <div className="p-4 border-b border-base-border">
        <h3 className="text-sm font-medium text-text-main">
          Tasks
          <span className="text-text-subtle font-normal ml-1.5">
            ({completedCount}/{tasks.length})
          </span>
        </h3>
      </div>

      {/* Add task */}
      <div className="p-3 border-b border-base-border flex items-center gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => onNewTaskChange(e.target.value)}
          placeholder="Tambah task baru..."
          className="flex-1 h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          onKeyDown={(e) => e.key === "Enter" && onAddTask()}
        />
        <Button
          size="sm"
          onClick={onAddTask}
          disabled={!newTask.trim()}
          className="h-8 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {/* Task list */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence initial={false}>
          {tasks.length === 0 ? (
            <EmptyTaskState />
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-hover/30 group border-b border-base-border last:border-b-0"
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="shrink-0"
                >
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-subtle hover:text-text-muted" />
                  )}
                </button>
                <span
                  className={`text-sm flex-1 ${
                    task.isCompleted
                      ? "line-through text-text-subtle"
                      : "text-text-main"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-subtle hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyTaskState() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-text-subtle" />
      </div>
      <p className="text-sm text-text-subtle">Belum ada task</p>
      <p className="text-xs text-text-subtle mt-1">
        Tambahkan task pertama untuk memulai
      </p>
    </div>
  );
}

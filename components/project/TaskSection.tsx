"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskSectionProps {
  tasks: Task[];
  newTask: string;
  onNewTaskChange: (val: string) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (reorderedTasks: Task[]) => void;
  onEditTask: (taskId: string, newTitle: string) => void;
}

export function TaskSection({
  tasks,
  newTask,
  onNewTaskChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  onEditTask,
}: TaskSectionProps) {
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  // Sort tasks by order field for display
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedTasks, oldIndex, newIndex).map(
        (t, i) => ({
          ...t,
          order: i,
        })
      );

      onReorderTasks(reordered);
    },
    [sortedTasks, onReorderTasks]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeTask = activeId
    ? sortedTasks.find((t) => t.id === activeId)
    : null;

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

      {/* Task list with DnD */}
      <div className="max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <EmptyTaskState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={sortedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence initial={false}>
                {sortedTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-base-card border border-brand-primary/30 rounded-lg px-4 py-2.5 shadow-lg shadow-brand-primary/10 opacity-90 flex items-center gap-3">
                  <GripVertical className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  {activeTask.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-subtle shrink-0" />
                  )}
                  <span
                    className={`text-sm flex-1 ${
                      activeTask.isCompleted
                        ? "line-through text-text-subtle"
                        : "text-text-main"
                    }`}
                  >
                    {activeTask.title}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// --- Sortable Task Item ---
function SortableTaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  // Enter edit mode
  const handleDoubleClick = () => {
    setEditValue(task.title);
    setIsEditing(true);
  };

  // Save edit
  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, task.id, task.title, onEdit]);

  // Cancel edit
  const handleCancel = useCallback(() => {
    setEditValue(task.title);
    setIsEditing(false);
  }, [task.title]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 px-3 py-2.5 hover:bg-base-hover/30 group border-b border-base-border last:border-b-0 ${
        isDragging ? "opacity-50 bg-base-hover/20" : ""
      }`}
    >
      {/* Drag handle — disabled when editing */}
      <button
        {...attributes}
        {...listeners}
        className={`p-1 rounded text-text-subtle hover:text-text-muted transition-opacity shrink-0 ${
          isEditing
            ? "opacity-20 cursor-default"
            : "opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        }`}
        tabIndex={isEditing ? -1 : 0}
        aria-label="Drag to reorder"
        disabled={isEditing}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="shrink-0"
        aria-label={task.isCompleted ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Circle className="w-4 h-4 text-text-subtle hover:text-text-muted" />
        )}
      </button>

      {/* Title — editable via double-click */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          onBlur={handleSave}
          className="flex-1 text-sm bg-base-bg border border-brand-primary rounded px-2 py-0.5 text-text-main focus:outline-none min-w-0"
        />
      ) : (
        <span
          className={`text-sm flex-1 cursor-text ${
            task.isCompleted
              ? "line-through text-text-subtle"
              : "text-text-main"
          }`}
          onDoubleClick={handleDoubleClick}
          title="Double-click untuk edit"
        >
          {task.title}
        </span>
      )}

      {/* Edit hint icon — shows on hover when not editing */}
      {!isEditing && (
        <button
          onClick={() => {
            setEditValue(task.title);
            setIsEditing(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-base-hover text-text-subtle hover:text-text-muted transition-opacity shrink-0"
          title="Edit task"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-subtle hover:text-red-400 transition-opacity shrink-0"
        aria-label="Delete task"
      >
        <Trash2 className="w-3 h-3" />
      </button>
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

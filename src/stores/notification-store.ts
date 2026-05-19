import { create } from "zustand";
import { Project } from "@/lib/types";

// ==================== NOTIFICATION TYPES ====================

export type NotificationType =
  | "deadline_warning"
  | "overdue"
  | "status_change"
  | "payment_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  generateFromProjects: (projects: Project[]) => void;
}

// Generate a stable ID from project ID + notification type
function generateNotificationId(
  projectId: string,
  type: NotificationType
): string {
  return `${projectId}-${type}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const id = generateNotificationId(
      notification.projectId || Math.random().toString(36).slice(2),
      notification.type
    );

    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    set((state) => {
      // Avoid duplicates by ID
      const existing = state.notifications.find((n) => n.id === id);
      if (existing) return state;

      const updated = [newNotification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  generateFromProjects: (projects) => {
    const newNotifications: Notification[] = [];

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    for (const project of projects) {
      // Skip completed or cancelled projects
      if (project.status === "COMPLETED" || project.status === "CANCELLED")
        continue;

      // Check for overdue deadline
      if (project.deadline) {
        const deadlineTime = new Date(project.deadline).getTime();
        const daysOverdue = Math.ceil(
          (now - deadlineTime) / (1000 * 60 * 60 * 24)
        );

        if (daysOverdue > 0) {
          newNotifications.push({
            id: generateNotificationId(project.id, "overdue"),
            type: "overdue",
            title: "Project Overdue",
            message: `${project.projectName} sudah melewati deadline ${daysOverdue} hari yang lalu`,
            projectId: project.id,
            projectName: project.projectName,
            timestamp: new Date(deadlineTime),
            read: false,
          });
        } else if (deadlineTime - now <= threeDaysMs) {
          // Deadline within 3 days
          const daysRemaining = Math.ceil(
            (deadlineTime - now) / (1000 * 60 * 60 * 24)
          );
          newNotifications.push({
            id: generateNotificationId(project.id, "deadline_warning"),
            type: "deadline_warning",
            title: "Deadline Mendekat",
            message: `${project.projectName} deadline dalam ${daysRemaining} hari`,
            projectId: project.id,
            projectName: project.projectName,
            timestamp: new Date(deadlineTime - threeDaysMs),
            read: false,
          });
        }
      }

      // Check for unpaid or partial payment
      if (
        project.paymentStatus === "UNPAID" ||
        project.paymentStatus === "PARTIAL"
      ) {
        const paymentLabel =
          project.paymentStatus === "UNPAID" ? "belum dibayar" : "belum lunas";
        newNotifications.push({
          id: generateNotificationId(project.id, "payment_update"),
          type: "payment_update",
          title: "Pembayaran Belum Lunas",
          message: `${project.projectName} — pembayaran ${paymentLabel}`,
          projectId: project.id,
          projectName: project.projectName,
          timestamp: new Date(project.updatedAt || project.createdAt),
          read: false,
        });
      }
    }

    // Preserve read state from existing notifications
    const currentNotifications = get().notifications;
    const readMap = new Map<string, boolean>();
    for (const n of currentNotifications) {
      readMap.set(n.id, n.read);
    }

    // Merge: use new notifications but preserve read state
    const merged = newNotifications.map((n) => ({
      ...n,
      read: readMap.get(n.id) ?? false,
    }));

    // Sort: unread first, then by timestamp descending
    merged.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    set({
      notifications: merged,
      unreadCount: merged.filter((n) => !n.read).length,
    });
  },
}));

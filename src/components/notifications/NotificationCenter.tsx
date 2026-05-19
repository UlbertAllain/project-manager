"use client";

import { useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCheck,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationStore,
  type Notification,
} from "@/stores/notification-store";
import { useProjects } from "@/hooks/useProjects";
import { formatRelativeTime } from "@/lib/helpers";

interface NotificationCenterProps {
  onNavigate: (view: string) => void;
  onSelectProject: (id: string) => void;
}

// Icon component based on notification type
function NotificationIcon({ type }: { type: Notification["type"] }) {
  switch (type) {
    case "overdue":
      return (
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
      );
    case "deadline_warning":
      return (
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
      );
    case "payment_update":
      return (
        <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
      );
    case "status_change":
      return (
        <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
      );
    default:
      return (
        <Bell className="w-3.5 h-3.5 text-text-subtle shrink-0 mt-0.5" />
      );
  }
}

// Left border color based on notification type
function getBorderColor(type: Notification["type"]): string {
  switch (type) {
    case "overdue":
      return "border-l-red-400";
    case "deadline_warning":
      return "border-l-amber-400";
    case "payment_update":
      return "border-l-emerald-400";
    case "status_change":
      return "border-l-blue-400";
    default:
      return "border-l-text-subtle";
  }
}

export function NotificationCenter({
  onNavigate,
  onSelectProject,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    generateFromProjects,
  } = useNotificationStore();

  const { data: projects } = useProjects();

  // Generate notifications when projects data changes
  useEffect(() => {
    if (projects) {
      generateFromProjects(projects);
    }
  }, [projects, generateFromProjects]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.projectId) {
      onNavigate("projects");
      onSelectProject(notification.projectId);
    }
  };

  const displayedNotifications = notifications.slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-1.5 rounded-md hover:bg-base-hover text-text-muted hover:text-text-main transition-colors shrink-0"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-base-card border-base-border shadow-lg rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-base-border">
          <span className="text-xs font-medium text-text-main">
            Notifikasi
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-brand-primary/15 text-brand-primary">
                {unreadCount}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-1.5 text-[10px] text-text-subtle hover:text-text-main"
              >
                <CheckCheck className="w-3 h-3 mr-0.5" />
                Tandai dibaca
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-1.5 text-[10px] text-text-subtle hover:text-red-400"
              >
                <Trash2 className="w-3 h-3 mr-0.5" />
                Hapus
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Bell className="w-8 h-8 text-text-subtle mb-2" />
            <p className="text-xs text-text-muted">Tidak ada notifikasi</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="flex flex-col">
              {displayedNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left py-2.5 px-3 hover:bg-base-hover transition-colors border-l-2 ${getBorderColor(notification.type)} ${
                      !notification.read
                        ? "bg-brand-primary/[0.03]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-text-main truncate">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-text-subtle mt-1 block">
                          {formatRelativeTime(
                            notification.timestamp.toISOString()
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                  {index < displayedNotifications.length - 1 && (
                    <Separator className="bg-base-border/50" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

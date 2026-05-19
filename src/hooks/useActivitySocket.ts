"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface ActivityEvent {
  type: string;
  projectId?: string;
  projectName?: string;
  message: string;
  timestamp: string;
  user?: string;
}

export function useActivitySocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket via gateway
    const socket = io("/?XTransformPort=3003", {
      path: "/",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to activity stream");
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from activity stream");
    });

    // When data changes, invalidate relevant queries
    socket.on("data-changed", (payload: { entity: string; id?: string }) => {
      if (payload.entity === "project") {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        if (payload.id) {
          queryClient.invalidateQueries({ queryKey: ["project", payload.id] });
        }
      }
      if (payload.entity === "transaction") {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
      }
      if (payload.entity === "comment") {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Emit activity event
  const emitActivity = useCallback((event: ActivityEvent) => {
    socketRef.current?.emit("activity", event);
  }, []);

  // Emit data change signal
  const emitDataChanged = useCallback((entity: string, id?: string) => {
    socketRef.current?.emit("data-changed", { entity, id });
  }, []);

  // Join a project room
  const joinProject = useCallback((projectId: string) => {
    socketRef.current?.emit("join-project", projectId);
  }, []);

  // Leave a project room
  const leaveProject = useCallback((projectId: string) => {
    socketRef.current?.emit("leave-project", projectId);
  }, []);

  return { emitActivity, emitDataChanged, joinProject, leaveProject };
}

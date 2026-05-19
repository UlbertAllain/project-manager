import { Server } from "socket.io";

const PORT = 3003;

const io = new Server(PORT, {
  path: "/",
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface ActivityEvent {
  type: "PROJECT_UPDATED" | "PROJECT_CREATED" | "PROJECT_DELETED" | "TASK_UPDATED" | "TRANSACTION_ADDED" | "COMMENT_ADDED";
  projectId?: string;
  projectName?: string;
  message: string;
  timestamp: string;
  user?: string;
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a project-specific room
  socket.on("join-project", (projectId: string) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project:${projectId}`);
  });

  // Leave a project room
  socket.on("leave-project", (projectId: string) => {
    socket.leave(`project:${projectId}`);
    console.log(`Socket ${socket.id} left project:${projectId}`);
  });

  // Broadcast activity events
  socket.on("activity", (event: ActivityEvent) => {
    // Broadcast to all clients (including sender for consistency)
    io.emit("activity", event);

    // Also broadcast to project-specific room
    if (event.projectId) {
      io.to(`project:${event.projectId}`).emit("project-activity", event);
    }
  });

  // Broadcast data changes (for real-time refetch signals)
  socket.on("data-changed", (payload: { entity: string; id?: string }) => {
    io.emit("data-changed", payload);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log(`🔌 Activity WebSocket server running on port ${PORT}`);

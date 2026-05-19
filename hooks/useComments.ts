"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";

async function createComment(payload: Record<string, unknown>) {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Gagal menambah komentar");
  }
  return res.json();
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      const projectId = variables.projectId as string | undefined;
      getSocket()?.emit("data-changed", { entity: "comment", id: projectId });
      getSocket()?.emit("activity", {
        type: "COMMENT_ADDED",
        projectId,
        message: "Comment added",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

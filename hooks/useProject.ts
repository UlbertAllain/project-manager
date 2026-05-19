"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/lib/types";
import { getSocket } from "@/lib/socket";

async function fetchProject(id: string): Promise<Project | null> {
  const res = await fetch(`/api/projects/${id}`);
  const data = await res.json();
  return data.data || null;
}

async function updateProject({
  id,
  ...payload
}: { id: string } & Record<string, unknown>) {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Gagal update project");
  }
  return res.json();
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Gagal menghapus project");
  }
  return res.json();
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>([
        "project",
        projectId,
      ]);

      // Optimistically update
      if (previousProject) {
        queryClient.setQueryData<Project>(["project", projectId], {
          ...previousProject,
          ...variables,
          id: projectId,
        });
      }

      return { previousProject };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["project", projectId],
          context.previousProject
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onSuccess: () => {
      getSocket()?.emit("data-changed", { entity: "project", id: projectId });
      getSocket()?.emit("activity", {
        type: "PROJECT_UPDATED",
        projectId,
        message: "Project updated",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      getSocket()?.emit("data-changed", { entity: "project", id });
      getSocket()?.emit("activity", {
        type: "PROJECT_DELETED",
        projectId: id,
        message: "Project deleted",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/lib/types";
import { getSocket } from "@/lib/socket";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  const data = await res.json();
  return data.data || [];
}

async function createProject(payload: Record<string, unknown>) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Gagal membuat project");
  }
  return res.json();
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

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      getSocket()?.emit("data-changed", { entity: "project" });
      getSocket()?.emit("activity", {
        type: "PROJECT_CREATED",
        message: "New project created",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      getSocket()?.emit("data-changed", { entity: "project", id: variables.id });
      getSocket()?.emit("activity", {
        type: "PROJECT_UPDATED",
        projectId: variables.id,
        message: "Project updated",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useDeleteProject() {
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

export function useDuplicateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menduplikasi project");
      }
      return res.json();
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      getSocket()?.emit("data-changed", { entity: "project", id: projectId });
      getSocket()?.emit("activity", {
        type: "PROJECT_CREATED",
        projectId,
        message: "Project duplicated",
        timestamp: new Date().toISOString(),
      });
      toast.success("Project berhasil diduplikasi!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menduplikasi project");
    },
  });
}

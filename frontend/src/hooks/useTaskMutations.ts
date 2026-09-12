import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks";
import type { TaskStatus } from "../types";

// Every mutation below invalidates broadly (tasks, dashboard, activity-feed)
// rather than trying to patch every cache precisely: the WebSocket push
// (see useActivityFeed/useNotifications) already gives other viewers instant
// feedback, so the acting user's own extra REST refetch here is just cheap
// cache-consistency insurance, not the primary real-time mechanism.
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.updateTaskStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["task"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: tasksApi.UpdateTaskInput }) => tasksApi.updateTask(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["task"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: tasksApi.CreateTaskInput) => tasksApi.createTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

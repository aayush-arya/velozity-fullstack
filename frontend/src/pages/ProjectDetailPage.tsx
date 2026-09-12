import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projects";
import { listTasks } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import { useUrlTaskFilters } from "../hooks/useUrlTaskFilters";
import { useUpdateTaskStatus } from "../hooks/useTaskMutations";
import { Topbar } from "../components/layout/Topbar";
import { Spinner } from "../components/common/Spinner";
import { TaskFilterBar } from "../components/filters/TaskFilterBar";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { TaskDetailPanel } from "../components/tasks/TaskDetailPanel";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { ActivityFeed } from "../components/activity/ActivityFeed";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "PM";

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  });

  const fixedFilters = useMemo(() => ({ projectId }), [projectId]);
  const filterControls = useUrlTaskFilters(fixedFilters);
  const { data: taskData, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", filterControls.filters],
    queryFn: () => listTasks(filterControls.filters),
    enabled: Boolean(projectId),
  });

  const updateStatus = useUpdateTaskStatus();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Topbar title={loadingProject || !project ? "Project" : project.name} />
      <main className="flex-1 overflow-y-auto p-6">
        {loadingProject || !project ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  {project.client.name} · PM: {project.createdBy.name}
                </p>
                {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>}
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  + New task
                </button>
              )}
            </div>

            <TaskFilterBar {...filterControls} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
              <div className="xl:col-span-3">
                {loadingTasks || !taskData ? (
                  <div className="flex justify-center py-16">
                    <Spinner />
                  </div>
                ) : (
                  <TaskBoard
                    tasks={taskData.items}
                    onOpenTask={setOpenTaskId}
                    statusChangePendingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                    onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                  />
                )}
              </div>
              <ActivityFeed projectId={projectId} title="This project's activity" />
            </div>
          </div>
        )}
      </main>

      {openTaskId && <TaskDetailPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
      {showCreate && projectId && <CreateTaskModal projectId={projectId} onClose={() => setShowCreate(false)} />}
    </>
  );
}

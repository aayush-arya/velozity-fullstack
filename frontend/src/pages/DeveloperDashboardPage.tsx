import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDeveloperDashboard } from "../api/dashboard";
import { listTasks } from "../api/tasks";
import { useUrlTaskFilters } from "../hooks/useUrlTaskFilters";
import { useUpdateTaskStatus } from "../hooks/useTaskMutations";
import { Topbar } from "../components/layout/Topbar";
import { StatCard } from "../components/common/StatCard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { TaskFilterBar } from "../components/filters/TaskFilterBar";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskDetailPanel } from "../components/tasks/TaskDetailPanel";
import { Spinner } from "../components/common/Spinner";
import { EmptyState } from "../components/common/EmptyState";

export default function DeveloperDashboardPage() {
  const { data: summary } = useQuery({ queryKey: ["dashboard", "developer"], queryFn: getDeveloperDashboard });
  const filterControls = useUrlTaskFilters();
  const { filters } = filterControls;
  const { data, isLoading } = useQuery({ queryKey: ["tasks", filters], queryFn: () => listTasks(filters) });
  const updateStatus = useUpdateTaskStatus();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  return (
    <>
      <Topbar title="My Tasks" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {summary && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="To Do" value={summary.tasksByStatus.TODO} />
              <StatCard label="In Progress" value={summary.tasksByStatus.IN_PROGRESS} />
              <StatCard label="In Review" value={summary.tasksByStatus.IN_REVIEW} />
              <StatCard label="Done" value={summary.tasksByStatus.DONE} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-800">Assigned to me (by priority, then due date)</h2>
                <TaskFilterBar {...filterControls} />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : !data || data.items.length === 0 ? (
                <EmptyState title="No tasks match these filters" />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showProject
                      onOpen={() => setOpenTaskId(task.id)}
                      statusChangePending={updateStatus.isPending}
                      onStatusChange={(status) => updateStatus.mutate({ id: task.id, status })}
                    />
                  ))}
                </div>
              )}
            </div>

            <ActivityFeed title="Activity on my tasks" />
          </div>
        </div>
      </main>

      {openTaskId && <TaskDetailPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
    </>
  );
}

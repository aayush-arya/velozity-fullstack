import type { Task, TaskStatus } from "../../types";
import { STATUS_LABELS } from "./StatusBadge";
import { TaskCard } from "./TaskCard";
import { EmptyState } from "../common/EmptyState";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function TaskBoard({
  tasks,
  onOpenTask,
  onStatusChange,
  statusChangePendingId,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  statusChangePendingId?: string;
}) {
  if (tasks.length === 0) {
    return <EmptyState title="No tasks match these filters" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="rounded-xl bg-slate-100/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{STATUS_LABELS[status]}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{columnTasks.length}</span>
            </div>
            <div className="space-y-2.5">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={() => onOpenTask(task.id)}
                  statusChangePending={statusChangePendingId === task.id}
                  onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

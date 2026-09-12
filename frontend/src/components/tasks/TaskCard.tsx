import type { Task, TaskStatus } from "../../types";
import { PriorityBadge } from "./PriorityBadge";
import { TaskStatusSelect } from "./TaskStatusSelect";
import { formatDate } from "../../utils/formatRelativeTime";

export function TaskCard({
  task,
  onOpen,
  onStatusChange,
  statusChangePending,
  showProject,
}: {
  task: Task;
  onOpen: () => void;
  onStatusChange: (status: TaskStatus) => void;
  statusChangePending?: boolean;
  showProject?: boolean;
}) {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">
          <span className="text-slate-400">#{task.number}</span> {task.title}
        </p>
        {task.isOverdue && (
          <span className="flex-none rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            OVERDUE
          </span>
        )}
      </div>

      {showProject && <p className="mb-2 text-xs text-slate-400">{task.project.name}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <span className="text-xs text-slate-400">Due {formatDate(task.dueDate)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{task.assignedTo ? task.assignedTo.name : "Unassigned"}</span>
        <TaskStatusSelect value={task.status} onChange={onStatusChange} disabled={statusChangePending} />
      </div>
    </div>
  );
}

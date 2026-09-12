import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTask } from "../../api/tasks";
import { listUsers } from "../../api/misc";
import { useAuth } from "../../context/AuthContext";
import { useUpdateTask, useUpdateTaskStatus } from "../../hooks/useTaskMutations";
import { Modal } from "../common/Modal";
import { Spinner } from "../common/Spinner";
import { PriorityBadge } from "./PriorityBadge";
import { TaskStatusSelect } from "./TaskStatusSelect";
import { RelativeTime } from "../common/RelativeTime";
import { formatDate } from "../../utils/formatRelativeTime";
import type { Priority } from "../../types";

export function TaskDetailPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "PM";
  const [editing, setEditing] = useState(false);

  const { data: task, isLoading } = useQuery({ queryKey: ["task", taskId], queryFn: () => getTask(taskId) });
  const { data: developers } = useQuery({
    queryKey: ["users", "DEVELOPER"],
    queryFn: () => listUsers("DEVELOPER"),
    enabled: canManage && editing,
  });

  const updateStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();

  return (
    <Modal title={task ? `Task #${task.number}` : "Task"} onClose={onClose} wide>
      {isLoading || !task ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
              {task.isOverdue && (
                <span className="flex-none rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  OVERDUE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{task.project.name}</p>
          </div>

          {task.description && <p className="text-sm text-slate-600">{task.description}</p>}

          {!editing ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
              <Field label="Status">
                <TaskStatusSelect
                  value={task.status}
                  disabled={updateStatus.isPending}
                  onChange={(status) => updateStatus.mutate({ id: task.id, status })}
                />
              </Field>
              <Field label="Priority">
                <PriorityBadge priority={task.priority} />
              </Field>
              <Field label="Assignee">{task.assignedTo?.name ?? "Unassigned"}</Field>
              <Field label="Due date">{formatDate(task.dueDate)}</Field>
            </div>
          ) : (
            <EditTaskForm
              taskId={task.id}
              initial={{ priority: task.priority, dueDate: task.dueDate.slice(0, 10), assignedToId: task.assignedTo?.id ?? "" }}
              developers={developers ?? []}
              onDone={() => setEditing(false)}
              pending={updateTask.isPending}
              onSubmit={(input) => updateTask.mutate({ id: task.id, input }, { onSuccess: () => setEditing(false) })}
            />
          )}

          {canManage && !editing && (
            <button onClick={() => setEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">
              Edit priority, due date, or assignee
            </button>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800">History</h4>
            <ul className="max-h-56 space-y-2 overflow-y-auto border-t border-slate-100 pt-2">
              {task.activityLog.map((entry) => (
                <li key={entry.id} className="text-sm text-slate-600">
                  <span>{entry.message}</span>{" "}
                  <RelativeTime date={entry.createdAt} className="text-xs text-slate-400" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function EditTaskForm({
  initial,
  developers,
  onSubmit,
  onDone,
  pending,
}: {
  taskId: string;
  initial: { priority: Priority; dueDate: string; assignedToId: string };
  developers: { id: string; name: string }[];
  onSubmit: (input: { priority: Priority; dueDate: string; assignedToId: string | null }) => void;
  onDone: () => void;
  pending: boolean;
}) {
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [assignedToId, setAssignedToId] = useState(initial.assignedToId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ priority, dueDate, assignedToId: assignedToId || null });
      }}
      className="space-y-3 rounded-lg bg-slate-50 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
          >
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Assignee</span>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
          >
            <option value="">Unassigned</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </form>
  );
}

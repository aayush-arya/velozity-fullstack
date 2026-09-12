import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "../../api/misc";
import { useCreateTask } from "../../hooks/useTaskMutations";
import { Modal } from "../common/Modal";
import { getApiErrorMessage } from "../../api/client";
import type { Priority } from "../../types";

export function CreateTaskModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: developers } = useQuery({ queryKey: ["users", "DEVELOPER"], queryFn: () => listUsers("DEVELOPER") });
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="New task" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createTask.mutate(
            { projectId, title, description: description || undefined, assignedToId: assignedToId || undefined, priority, dueDate },
            { onSuccess: onClose, onError: (err) => setError(getApiErrorMessage(err)) }
          );
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assignee</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {developers?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createTask.isPending}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Create task
          </button>
        </div>
      </form>
    </Modal>
  );
}

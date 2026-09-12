import type { TaskStatus } from "../../types";
import { STATUS_LABELS } from "./StatusBadge";

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function TaskStatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none disabled:opacity-50"
    >
      {ALL_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

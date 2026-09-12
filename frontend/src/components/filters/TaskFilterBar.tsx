import type { useUrlTaskFilters } from "../../hooks/useUrlTaskFilters";
import { STATUS_LABELS } from "../tasks/StatusBadge";
import type { Priority, TaskStatus } from "../../types";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type FilterControls = ReturnType<typeof useUrlTaskFilters>;

export function TaskFilterBar({ filters, setFilter, clearFilters, hasActiveFilters }: FilterControls) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.status ?? ""}
        onChange={(e) => setFilter("status", e.target.value || undefined)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={filters.priority ?? ""}
        onChange={(e) => setFilter("priority", e.target.value || undefined)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-sm text-slate-500">
        Due
        <input
          type="date"
          value={filters.dueDateFrom ?? ""}
          onChange={(e) => setFilter("dueDateFrom", e.target.value || undefined)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={filters.dueDateTo ?? ""}
          onChange={(e) => setFilter("dueDateTo", e.target.value || undefined)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-sm font-medium text-brand-600 hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

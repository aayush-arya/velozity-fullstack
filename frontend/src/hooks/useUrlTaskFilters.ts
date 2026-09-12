import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Priority, TaskFilters, TaskStatus } from "../types";

const FILTER_KEYS = ["status", "priority", "dueDateFrom", "dueDateTo", "projectId", "assignedToId"] as const;

// Filters live in the URL (query params) rather than component state, so a
// filtered view is a link someone can copy, bookmark, or send to a
// teammate and land on the same filtered list - not just something you can
// only reach by clicking through the UI yourself.
export function useUrlTaskFilters(fixed: Partial<TaskFilters> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TaskFilters = useMemo(() => {
    const fromUrl: TaskFilters = {
      status: (searchParams.get("status") as TaskStatus) || undefined,
      priority: (searchParams.get("priority") as Priority) || undefined,
      dueDateFrom: searchParams.get("dueDateFrom") || undefined,
      dueDateTo: searchParams.get("dueDateTo") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      assignedToId: searchParams.get("assignedToId") || undefined,
    };
    return { ...fromUrl, ...fixed };
  }, [searchParams, fixed]);

  function setFilter(key: (typeof FILTER_KEYS)[number], value: string | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }

  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.get(key) && !(key in fixed));

  return { filters, setFilter, clearFilters, hasActiveFilters };
}

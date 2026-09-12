import { RelativeTime } from "../common/RelativeTime";
import type { ActivityFeedEvent } from "../../types";

const ACTION_ICON: Record<ActivityFeedEvent["action"], string> = {
  TASK_CREATED: "✨",
  STATUS_CHANGED: "🔁",
  TASK_ASSIGNED: "👤",
  TASK_UPDATED: "✏️",
  TASK_OVERDUE: "⏰",
};

export function ActivityItem({ event }: { event: ActivityFeedEvent }) {
  return (
    <li className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-sm">
        {event.user ? event.user.name.charAt(0).toUpperCase() : ACTION_ICON[event.action]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700">{event.message}</p>
        <RelativeTime date={event.createdAt} className="text-xs text-slate-400" />
      </div>
    </li>
  );
}

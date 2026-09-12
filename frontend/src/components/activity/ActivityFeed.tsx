import { useActivityFeed } from "../../hooks/useActivityFeed";
import { Spinner } from "../common/Spinner";
import { EmptyState } from "../common/EmptyState";
import { ActivityItem } from "./ActivityItem";

export function ActivityFeed({ projectId, title = "Live activity" }: { projectId?: string; title?: string }) {
  const { data, isLoading } = useActivityFeed(projectId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : data && data.items.length > 0 ? (
        <ul className="max-h-[28rem] overflow-y-auto">
          {data.items.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <EmptyState title="No activity yet" hint="Updates will appear here in real time." />
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPmDashboard } from "../api/dashboard";
import { Topbar } from "../components/layout/Topbar";
import { StatCard } from "../components/common/StatCard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { Spinner } from "../components/common/Spinner";
import { EmptyState } from "../components/common/EmptyState";
import { PriorityBadge } from "../components/tasks/PriorityBadge";
import { formatDate } from "../utils/formatRelativeTime";
import type { Priority } from "../types";

export default function PmDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard", "pm"], queryFn: getPmDashboard });

  return (
    <>
      <Topbar title="PM Overview" />
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="My Projects" value={data.projects.length} />
              <StatCard label="Overdue Tasks" value={data.overdueCount} accent="red" />
              <StatCard label="Due This Week" value={data.upcomingDueDates.length} accent="brand" />
              <StatCard
                label="Critical Priority"
                value={data.tasksByPriority.CRITICAL}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">My projects</h3>
                    <Link to="/projects" className="text-xs font-medium text-brand-600 hover:underline">
                      View all
                    </Link>
                  </div>
                  {data.projects.length === 0 ? (
                    <EmptyState title="No projects yet" hint="Create one from the Projects page." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.projects.map((p) => (
                        <li key={p.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <Link to={`/projects/${p.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                              {p.name}
                            </Link>
                            <p className="text-xs text-slate-400">{p.client.name}</p>
                          </div>
                          <span className="text-xs text-slate-500">{p._count.tasks} tasks</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Tasks by priority</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(Object.entries(data.tasksByPriority) as [Priority, number][]).map(([priority, count]) => (
                      <div key={priority} className="rounded-lg border border-slate-100 p-3 text-center">
                        <p className="text-xl font-semibold text-slate-800">{count}</p>
                        <PriorityBadge priority={priority} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Due this week</h3>
                  {data.upcomingDueDates.length === 0 ? (
                    <EmptyState title="Nothing due in the next 7 days" />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.upcomingDueDates.map((task) => (
                        <li key={task.id} className="flex items-center justify-between py-2.5 text-sm">
                          <div>
                            <p className="font-medium text-slate-700">
                              #{task.number} {task.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {task.assignedTo?.name ?? "Unassigned"} · {task.project.name}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">{formatDate(task.dueDate)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <ActivityFeed title="My projects' activity" />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

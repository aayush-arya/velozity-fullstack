import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../api/dashboard";
import { usePresence } from "../hooks/usePresence";
import { Topbar } from "../components/layout/Topbar";
import { StatCard } from "../components/common/StatCard";
import { ActivityFeed } from "../components/activity/ActivityFeed";
import { Spinner } from "../components/common/Spinner";
import { STATUS_LABELS } from "../components/tasks/StatusBadge";
import type { TaskStatus } from "../types";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard", "admin"], queryFn: getAdminDashboard });
  const onlineCount = usePresence(data?.onlineUsers ?? 0);

  return (
    <>
      <Topbar title="Admin Overview" />
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Projects" value={data.totalProjects} />
              <StatCard label="Total Tasks" value={data.totalTasks} />
              <StatCard label="Overdue Tasks" value={data.overdueCount} accent="red" />
              <StatCard label="Users Online Now" value={onlineCount} accent="brand" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Tasks by status</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(Object.entries(data.tasksByStatus) as [TaskStatus, number][]).map(([status, count]) => (
                    <Link
                      key={status}
                      to={`/projects?status=${status}`}
                      className="rounded-lg border border-slate-100 p-3 text-center hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <p className="text-xl font-semibold text-slate-800">{count}</p>
                      <p className="text-xs text-slate-500">{STATUS_LABELS[status]}</p>
                    </Link>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  This is the global feed - every project, every change, across the whole agency.
                </p>
              </div>
              <ActivityFeed title="Global activity feed" />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

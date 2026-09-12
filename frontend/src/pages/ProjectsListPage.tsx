import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listProjects } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import { Topbar } from "../components/layout/Topbar";
import { Spinner } from "../components/common/Spinner";
import { EmptyState } from "../components/common/EmptyState";
import { CreateProjectModal } from "../components/projects/CreateProjectModal";

export default function ProjectsListPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: listProjects });
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = user?.role === "ADMIN" || user?.role === "PM";

  return (
    <>
      <Topbar title="Projects" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {user?.role === "ADMIN" ? "All projects across the agency." : "Projects you created."}
          </p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              + New project
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState title="No projects yet" hint={canCreate ? "Create your first project to get started." : undefined} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                <p className="mb-3 text-xs text-slate-400">{project.client.name}</p>
                {project.description && <p className="mb-3 line-clamp-2 text-xs text-slate-500">{project.description}</p>}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{project._count.tasks} tasks</span>
                  <span>PM: {project.createdBy.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

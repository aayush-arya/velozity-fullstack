import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../notifications/NotificationBell";

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

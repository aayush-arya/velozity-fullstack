import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FullPageSpinner } from "../common/Spinner";
import { Sidebar } from "./Sidebar";

// Gates every authenticated route in one place: while the silent-refresh-on-
// mount check (see AuthProvider) is in flight we show a spinner instead of a
// flash of an empty sidebar, and an unauthenticated user never sees the app
// shell at all - just a redirect to /login.
export function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

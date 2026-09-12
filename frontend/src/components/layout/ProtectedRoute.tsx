import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

// AppLayout (the parent route element) already guarantees `user` is set and
// loading has settled before this ever renders - this component only adds
// the role check on top of that. As with AppLayout, this is a frontend
// convenience: the actual boundary is server-side (authorize() + the
// per-resource ensureCanAccess* checks in each service module).
export function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

export function homeRouteForRole(role: Role): string {
  if (role === "ADMIN") return "/admin";
  if (role === "PM") return "/pm";
  return "/developer";
}

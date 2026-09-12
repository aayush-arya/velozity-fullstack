import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute, homeRouteForRole } from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PmDashboardPage from "./pages/PmDashboardPage";
import DeveloperDashboardPage from "./pages/DeveloperDashboardPage";
import ProjectsListPage from "./pages/ProjectsListPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NotFoundPage from "./pages/NotFoundPage";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homeRouteForRole(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm"
          element={
            <ProtectedRoute allowedRoles={["PM"]}>
              <PmDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/developer"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER"]}>
              <DeveloperDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "PM"]}>
              <ProjectsListPage />
            </ProtectedRoute>
          }
        />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

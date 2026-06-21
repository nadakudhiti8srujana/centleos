import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/Spinner";

export function ProtectedRoute() {
  const { user, loading, canAccessCrm } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessCrm) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Access Restricted</h1>
        <p className="max-w-md text-slate-500 dark:text-slate-400">
          Your role ({user.role.replace(/_/g, " ")}) does not have CRM access. Contact your
          administrator.
        </p>
      </div>
    );
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (user) {
    if (user.role === "super_admin") {
      return <Navigate to="/super-admin" replace />;
    } else if (user.role === "user") {
      return <Navigate to="/user-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

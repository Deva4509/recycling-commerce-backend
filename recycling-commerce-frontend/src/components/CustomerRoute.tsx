import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomerRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="rp-admin-loading">Verifying access...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const role = String(user.role || "").toUpperCase();

  if (role === "ADMIN" || role === "STAFF") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

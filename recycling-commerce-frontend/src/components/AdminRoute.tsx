import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="rp-admin-loading">
        <div className="rp-admin-loading-orb" />
        <span>Verifying access...</span>
      </div>
    );
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

  if (role !== "ADMIN" && role !== "STAFF") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

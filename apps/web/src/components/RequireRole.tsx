import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getSessionUser,
  userCanAccessContentTools,
} from "@/lib/auth";

/** Fail-closed gate for content/admin routes (client-side stub until real auth). */
export function RequireContentTools() {
  const location = useLocation();
  if (!userCanAccessContentTools()) {
    return (
      <Navigate
        to="/auth?denied=admin"
        replace
        state={{ from: location }}
      />
    );
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const location = useLocation();
  const user = getSessionUser();
  if (user.role !== "admin") {
    return (
      <Navigate to="/admin?denied=admin_only" replace state={{ from: location }} />
    );
  }
  return <Outlet />;
}

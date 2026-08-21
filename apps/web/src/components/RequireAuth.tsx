import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

/** Fail-closed: app shell routes require a signed-in (demo or cloud) session. */
export function RequireAuth() {
  const location = useLocation();
  if (!isAuthenticated()) {
    const next = `${location.pathname}${location.search}`;
    const params = new URLSearchParams();
    if (next && next !== "/") params.set("next", next);
    const q = params.toString();
    return <Navigate to={q ? `/auth?${q}` : "/auth"} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

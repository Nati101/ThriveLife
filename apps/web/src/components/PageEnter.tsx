import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Subtle enter transition when the route changes. */
export function PageEnter({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}

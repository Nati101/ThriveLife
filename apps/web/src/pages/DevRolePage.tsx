import { useNavigate } from "react-router-dom";
import type { Role } from "@thrivelife/shared";
import {
  ROLES,
  ROLE_PERMISSIONS,
  getSessionUser,
  setDevRole,
} from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export function DevRolePage() {
  const user = getSessionUser();
  const navigate = useNavigate();

  function chooseRole(role: Role) {
    setDevRole(role);
    navigate(0);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Local stub auth"
        title="Switch role"
        description="Real auth will replace this (Base44 auth if we stay on their backend, otherwise Clerk/Auth.js). Cookie-based role switching tests RBAC gates."
      />
      <p className="mb-6 text-sm text-muted">
        Current stub session: <strong>{user.displayName}</strong> · role{" "}
        <strong>{ROLE_PERMISSIONS[user.role].label}</strong>
      </p>
      <div className="grid max-w-lg gap-3">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => chooseRole(role)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              user.role === role
                ? "border-brand bg-brand-soft"
                : "border-border bg-card/80 hover:border-brand"
            }`}
          >
            <span className="font-medium text-foreground">
              {ROLE_PERMISSIONS[role].label}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {ROLE_PERMISSIONS[role].description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

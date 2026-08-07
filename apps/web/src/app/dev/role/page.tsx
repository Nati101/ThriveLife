import { ROLES, ROLE_PERMISSIONS, type Role } from "@thrivelife/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_ROLE_COOKIE } from "@/lib/auth/constants";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/page-header";

async function setRole(formData: FormData) {
  "use server";
  const role = String(formData.get("role") ?? "");
  if (!(ROLES as readonly string[]).includes(role)) {
    return;
  }
  const jar = await cookies();
  jar.set(DEV_ROLE_COOKIE, role as Role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/dev/role");
}

export default async function DevRolePage() {
  const user = await getSessionUser();

  return (
    <div>
      <PageHeader
        eyebrow="Local stub auth"
        title="Switch role"
        description="Clerk (or Auth.js) will replace this. Cookie-based role switching lets us test RBAC gates without API keys."
      />
      <p className="mb-6 text-sm text-muted">
        Current stub session: <strong>{user.displayName}</strong> · role{" "}
        <strong>{ROLE_PERMISSIONS[user.role].label}</strong>
      </p>
      <form action={setRole} className="grid max-w-lg gap-3">
        {ROLES.map((role) => (
          <button
            key={role}
            type="submit"
            name="role"
            value={role}
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
      </form>
    </div>
  );
}

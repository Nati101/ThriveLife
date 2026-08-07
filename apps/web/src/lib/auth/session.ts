import {
  type Role,
  isRole,
  ROLE_PERMISSIONS,
  type Permission,
  hasPermission,
} from "@thrivelife/shared";
import { cookies } from "next/headers";
import { DEV_ROLE_COOKIE } from "./constants";

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  /** Stub until real auth; always true in local scaffold. */
  ageVerified: boolean;
  isStub: true;
};

const DEFAULT_ROLE: Role = "user";

export async function getSessionUser(): Promise<SessionUser> {
  const jar = await cookies();
  const raw = jar.get(DEV_ROLE_COOKIE)?.value;
  const role: Role = raw && isRole(raw) ? raw : DEFAULT_ROLE;

  return {
    id: "stub-user-local",
    displayName: "Local Pilot User",
    email: "local@thrivelife.dev",
    role,
    ageVerified: true,
    isStub: true,
  };
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: role "${user.role}" lacks ${permission}`);
  }
  return user;
}

export function roleLabel(role: Role): string {
  return ROLE_PERMISSIONS[role].label;
}

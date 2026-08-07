/**
 * App roles for the single web app (member flows + content tools).
 * Spec docs sometimes say "member"; the canonical role id is `user`.
 */
export const ROLES = ["user", "editor", "reviewer", "admin"] as const;

export type Role = (typeof ROLES)[number];

/** Draft role matrix — finalize with Joel before beta (QUESTIONS.md #9). */
export const ROLE_PERMISSIONS = {
  user: {
    label: "User",
    description: "Member flows: onboarding, dashboard, check-in, assessments",
    canAccessMemberApp: true,
    canDraftContent: false,
    canReviewContent: false,
    canPublishContent: false,
    canEditThresholds: false,
    canManageUsers: false,
  },
  editor: {
    label: "Editor",
    description: "Draft content (items, constructs, recharge copy)",
    canAccessMemberApp: true,
    canDraftContent: true,
    canReviewContent: false,
    canPublishContent: false,
    canEditThresholds: false,
    canManageUsers: false,
  },
  reviewer: {
    label: "Reviewer",
    description: "Review and approve drafted content",
    canAccessMemberApp: true,
    canDraftContent: true,
    canReviewContent: true,
    canPublishContent: false,
    canEditThresholds: false,
    canManageUsers: false,
  },
  admin: {
    label: "Admin",
    description: "Publish content, edit thresholds, manage users",
    canAccessMemberApp: true,
    canDraftContent: true,
    canReviewContent: true,
    canPublishContent: true,
    canEditThresholds: true,
    canManageUsers: true,
  },
} as const satisfies Record<
  Role,
  {
    label: string;
    description: string;
    canAccessMemberApp: boolean;
    canDraftContent: boolean;
    canReviewContent: boolean;
    canPublishContent: boolean;
    canEditThresholds: boolean;
    canManageUsers: boolean;
  }
>;

export type Permission = keyof Omit<
  (typeof ROLE_PERMISSIONS)[Role],
  "label" | "description"
>;

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Roles that may open /admin content tools (fail closed for everyone else). */
export const CONTENT_TOOL_ROLES: readonly Role[] = [
  "editor",
  "reviewer",
  "admin",
];

export function canAccessContentTools(role: Role): boolean {
  return CONTENT_TOOL_ROLES.includes(role);
}

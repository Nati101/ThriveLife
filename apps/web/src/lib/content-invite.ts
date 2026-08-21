/** Cookie: elevated content-tool roles require this after invite redeem. */
export const CONTENT_ACCESS_COOKIE = "tl_content_access";

/** Cookie for role (DEV / invite). Not a JWT — fail closed for elevates without access cookie. */
export const DEV_ROLE_COOKIE = "tl_dev_role";

/**
 * Default invite for Joel / content owners on static Pages.
 * Override with VITE_CONTENT_INVITE_CODE (client) or CONTENT_INVITE_CODE (server).
 * Share privately — it is embedded in the Pages bundle when used as default.
 */
export const DEFAULT_CONTENT_INVITE_CODE = "joel-thrivelife-content";

export function normalizeInviteCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, "-");
}

export function expectedContentInviteCodeFromEnv(
  viteCode?: string | null,
  serverCode?: string | null,
): string {
  const raw =
    serverCode?.trim() ||
    viteCode?.trim() ||
    DEFAULT_CONTENT_INVITE_CODE;
  return normalizeInviteCode(raw);
}

export function matchesContentInviteCode(
  code: string,
  viteCode?: string | null,
  serverCode?: string | null,
): boolean {
  return (
    normalizeInviteCode(code) ===
    expectedContentInviteCodeFromEnv(viteCode, serverCode)
  );
}

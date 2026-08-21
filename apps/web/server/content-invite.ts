import {
  CONTENT_ACCESS_COOKIE,
  DEFAULT_CONTENT_INVITE_CODE,
  DEV_ROLE_COOKIE,
  expectedContentInviteCodeFromEnv,
  matchesContentInviteCode,
  normalizeInviteCode,
} from "../src/lib/content-invite.ts";

export {
  CONTENT_ACCESS_COOKIE,
  DEFAULT_CONTENT_INVITE_CODE,
  DEV_ROLE_COOKIE,
  normalizeInviteCode,
};

export function expectedServerInviteCode(): string {
  return expectedContentInviteCodeFromEnv(
    process.env.VITE_CONTENT_INVITE_CODE,
    process.env.CONTENT_INVITE_CODE,
  );
}

export function inviteCodeMatches(code: string): boolean {
  return matchesContentInviteCode(
    code,
    process.env.VITE_CONTENT_INVITE_CODE,
    process.env.CONTENT_INVITE_CODE,
  );
}

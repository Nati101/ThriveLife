import { NextResponse, type NextRequest } from "next/server";
import { canAccessContentTools, isRole, type Role } from "@thrivelife/shared";
import { DEV_ROLE_COOKIE } from "@/lib/auth/constants";

function roleFromRequest(request: NextRequest): Role {
  const raw = request.cookies.get(DEV_ROLE_COOKIE)?.value;
  return raw && isRole(raw) ? raw : "user";
}

/**
 * Fail-closed gate for content/admin routes.
 * Real auth (Clerk) will replace cookie-based role in Phase 9.
 * Next.js 16: `proxy` replaces the deprecated `middleware` convention.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const role = roleFromRequest(request);
    if (!canAccessContentTools(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("denied", "admin");
      return NextResponse.redirect(url);
    }

    if (
      (pathname.startsWith("/admin/thresholds") ||
        pathname.startsWith("/admin/users")) &&
      role !== "admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.searchParams.set("denied", "admin_only");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

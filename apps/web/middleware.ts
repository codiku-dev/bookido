import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_AUTH_COOKIE = "admin-authenticated";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");

  if (!isAdminPath) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    const signInUrl = new URL("/admin/signin", request.url);
    signInUrl.search = request.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  const isAdminPublicAuthPath =
    pathname === "/admin/signin" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  /** Sign-in funnel only: still allow `/admin/reset-password` when a session cookie exists (email link + token). */
  const isAdminAuthGatePath =
    pathname === "/admin/signin" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/forgot-password";

  const isAuthenticated = request.cookies.get(ADMIN_AUTH_COOKIE)?.value === "true";

  if (!isAuthenticated && !isAdminPublicAuthPath) {
    const signInUrl = new URL("/admin/signin", request.url);
    signInUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && isAdminAuthGatePath) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_AUTH_COOKIE = "admin-authenticated";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminLoginPath = pathname === "/admin/login";

  if (!isAdminPath) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.get(ADMIN_AUTH_COOKIE)?.value === "true";

  if (!isAuthenticated && !isAdminLoginPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAdminLoginPath) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

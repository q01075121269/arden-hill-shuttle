import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 보호 경로: /admin 및 그 하위 경로 (단, /admin/login은 허용)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("auth_session");

    if (!sessionCookie?.value) {
      // 미인증 상태 -> 로그인 페이지로 리다이렉트
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const user = JSON.parse(sessionCookie.value);
      const adminRoles = ["super_admin", "manager", "assistant1", "assistant2"];

      // 관리자 권한이 아닌 경우 로그인 페이지로 리다이렉트
      if (!user || !adminRoles.includes(user.role)) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("returnUrl", pathname);
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

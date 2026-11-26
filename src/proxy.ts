import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/sign-up", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/images")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  const sessionCookie =
    request.cookies.get("cit.session_token")?.value ??
    request.cookies.get("__Secure-cit.session_token")?.value;

  const hasCookie = Boolean(sessionCookie);

  if (!hasCookie && !isPublicRoute) {
    const signInUrl = new URL("/", request.url);
    const target = `${pathname}${search}`;
    if (target.startsWith("/") && !target.startsWith("//") && target !== "/") {
      signInUrl.searchParams.set("callbackUrl", target);
    }
    return NextResponse.redirect(signInUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/sign-up", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  const isApiAuthRoute = pathname.startsWith("/api/auth");

  // Allow API auth routes through (they need to handle their own auth)
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Check session cookie directly — no self-referential fetch needed
  const sessionCookie =
    request.cookies.get("cit.session_token")?.value ??
    request.cookies.get("__Secure-cit.session_token")?.value;

  const isAuthenticated = !!sessionCookie;

  // Redirect authenticated users away from public routes to /browse
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/browse", request.url));
  }

  // Redirect unauthenticated users to sign-in
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

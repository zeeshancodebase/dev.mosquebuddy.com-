// src/middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("sabeel_token")?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");
   const isPublicPage =
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/catalog");

  
    // Public pages — always allow
    if (isPublicPage) return NextResponse.next();

  // If visiting admin page without token → redirect to login
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If already logged in and visiting login → redirect to dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login","/unauthorized",],
};
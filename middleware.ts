import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If user is not authenticated, redirect to sign-in
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Specify which routes to protect
export const config = {
  matcher: [
    "/consult/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*"
  ],
}; 
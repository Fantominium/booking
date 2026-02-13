import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const middleware = async (request: NextRequest): Promise<NextResponse> => {
  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "truflow.session-token",
    });
  } catch {
    token = null;
  }

  // Allow access to the admin login page
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!token) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    // Redirect to custom admin login page
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers
  const response = NextResponse.next();

  // HTTPS redirect (FR-042)
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https";
    return NextResponse.redirect(redirectUrl);
  }

  // Security headers (FR-048, FR-205)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' api.stripe.com; frame-src js.stripe.com; font-src 'self' data:",
  );

  // HSTS headers for production (FR-205)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
};

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

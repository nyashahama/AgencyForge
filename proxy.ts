import { NextResponse, type NextRequest } from "next/server";
import { refreshWithBackend } from "@/lib/auth/backend-auth";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXP_COOKIE,
  REFRESH_TOKEN_COOKIE,
  applySessionCookies,
  clearSessionCookies,
  isTokenExpired,
} from "@/lib/auth/session-store";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/dashboard") {
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  }

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const expiresAt = Number(
    request.cookies.get(ACCESS_TOKEN_EXP_COOKIE)?.value ?? "0",
  );

  if (accessToken && expiresAt && !isTokenExpired(expiresAt)) {
    return NextResponse.next();
  }

  try {
    const session = await refreshWithBackend(refreshToken);
    const response = NextResponse.next();

    applySessionCookies(response.cookies, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    });

    return response;
  } catch {
    const response = redirectToLogin(request);
    clearSessionCookies(response.cookies);
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

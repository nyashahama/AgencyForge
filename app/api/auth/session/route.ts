import { NextResponse } from "next/server";
import { BackendAuthError, authErrorResponse, meWithBackend, refreshWithBackend, toAuthSession } from "@/lib/auth/backend-auth";
import { clearSession, getStoredSession, isTokenExpired, setSession } from "@/lib/auth/session-store";

export async function GET() {
  const storedSession = await getStoredSession();
  if (!storedSession?.refreshToken) {
    await clearSession();
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "No active session",
        },
      },
      { status: 401 },
    );
  }

  if (storedSession.accessToken && storedSession.expiresAt && !isTokenExpired(storedSession.expiresAt)) {
    try {
      const user = await meWithBackend(storedSession.accessToken);
      const expiresIn = Math.max(
        Math.ceil((storedSession.expiresAt - Date.now()) / 1000),
        0,
      );

      return NextResponse.json({
        data: {
          access_token: storedSession.accessToken,
          token_type: "Bearer",
          expires_in: expiresIn,
          user,
        },
      });
    } catch (error) {
      if (!(error instanceof BackendAuthError) || error.status !== 401) {
        return authErrorResponse(error);
      }
    }
  }

  try {
    const session = await refreshWithBackend(storedSession.refreshToken);
    await setSession({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    });

    return NextResponse.json({ data: toAuthSession(session) });
  } catch (error) {
    await clearSession();

    if (error instanceof BackendAuthError && error.status < 500) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Session expired",
          },
        },
        { status: 401 },
      );
    }

    return authErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { BackendAuthError, authErrorResponse, logoutWithBackend } from "@/lib/auth/backend-auth";
import { clearSession, getStoredSession } from "@/lib/auth/session-store";

export async function POST() {
  try {
    const storedSession = await getStoredSession();
    if (storedSession?.refreshToken) {
      await logoutWithBackend(storedSession.refreshToken);
    }
  } catch (error) {
    if (!(error instanceof BackendAuthError) || error.status >= 500) {
      return authErrorResponse(error);
    }
  }

  await clearSession();
  return new NextResponse(null, { status: 204 });
}

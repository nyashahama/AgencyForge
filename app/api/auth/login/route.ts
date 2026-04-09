import { NextResponse } from "next/server";
import { authErrorResponse, loginWithBackend, toAuthSession } from "@/lib/auth/backend-auth";
import { setSession } from "@/lib/auth/session-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    const session = await loginWithBackend(body);
    await setSession({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    });

    return NextResponse.json({ data: toAuthSession(session) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

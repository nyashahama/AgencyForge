import { NextResponse } from "next/server";
import { authErrorResponse, registerWithBackend, toAuthSession } from "@/lib/auth/backend-auth";
import { setSession } from "@/lib/auth/session-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    const session = await registerWithBackend(body);
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

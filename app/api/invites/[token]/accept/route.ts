import { NextResponse } from "next/server";
import {
  acceptInviteWithBackend,
  authErrorResponse,
  toAuthSession,
} from "@/lib/auth/backend-auth";
import { setSession } from "@/lib/auth/session-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as { name: string; password: string };
    const session = await acceptInviteWithBackend(token, body);

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

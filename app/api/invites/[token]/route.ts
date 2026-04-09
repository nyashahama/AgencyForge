import { NextResponse } from "next/server";
import { authErrorResponse, inspectInviteWithBackend } from "@/lib/auth/backend-auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const invite = await inspectInviteWithBackend(token);
    return NextResponse.json({ data: invite });
  } catch (error) {
    return authErrorResponse(error);
  }
}

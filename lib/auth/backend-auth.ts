import { NextResponse } from "next/server";
import type { AuthSession, InvitePreview, Session, SessionUser } from "@/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export class BackendAuthError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
    throw new BackendAuthError(
      response.status,
      payload.error?.code ?? "UNKNOWN",
      payload.error?.message ?? "Request failed",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export function toAuthSession(session: Session): AuthSession {
  return {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    user: session.user,
  };
}

export async function loginWithBackend(body: {
  email: string;
  password: string;
}): Promise<Session> {
  return backendRequest<Session>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function registerWithBackend(body: {
  name: string;
  email: string;
  password: string;
}): Promise<Session> {
  return backendRequest<Session>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function refreshWithBackend(refreshToken: string): Promise<Session> {
  return backendRequest<Session>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logoutWithBackend(refreshToken: string): Promise<void> {
  return backendRequest<void>("/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function meWithBackend(accessToken: string): Promise<SessionUser> {
  return backendRequest<SessionUser>("/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function inspectInviteWithBackend(token: string): Promise<InvitePreview> {
  return backendRequest<InvitePreview>(`/api/v1/invites/${token}`, {
    method: "GET",
  });
}

export async function acceptInviteWithBackend(
  token: string,
  body: { name: string; password: string },
): Promise<Session> {
  return backendRequest<Session>(`/api/v1/invites/${token}/accept`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof BackendAuthError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}

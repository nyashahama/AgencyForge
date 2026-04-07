import { cookies } from "next/headers";

const REFRESH_TOKEN_COOKIE = "af_refresh_token";
const ACCESS_TOKEN_COOKIE = "af_access_token";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const expiresAtStr = cookieStore.get(`${ACCESS_TOKEN_COOKIE}_exp`)?.value;

  if (!refreshToken) {
    return null;
  }

  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

  return {
    accessToken: accessToken ?? "",
    refreshToken,
    expiresAt,
  };
}

export async function setSession(session: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + session.expiresIn * 1000;

  cookieStore.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set(`${ACCESS_TOKEN_COOKIE}_exp`, String(expiresAt), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(`${ACCESS_TOKEN_COOKIE}_exp`);
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60000;
}

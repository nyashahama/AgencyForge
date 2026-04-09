import { cookies } from "next/headers";

export const REFRESH_TOKEN_COOKIE = "af_refresh_token";
export const ACCESS_TOKEN_COOKIE = "af_access_token";
export const ACCESS_TOKEN_EXP_COOKIE = `${ACCESS_TOKEN_COOKIE}_exp`;

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

type CookieWriter = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "lax";
      path: "/";
    },
  ) => unknown;
  delete: (name: string) => unknown;
};

function cookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/" as const,
  };
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const expiresAtStr = cookieStore.get(ACCESS_TOKEN_EXP_COOKIE)?.value;

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

export function applySessionCookies(cookieStore: CookieWriter, session: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): void {
  const expiresAt = Date.now() + session.expiresIn * 1000;

  cookieStore.set(ACCESS_TOKEN_COOKIE, session.accessToken, cookieOptions(true));
  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refreshToken, cookieOptions(true));
  cookieStore.set(ACCESS_TOKEN_EXP_COOKIE, String(expiresAt), cookieOptions(true));
}

export function clearSessionCookies(cookieStore: Pick<CookieWriter, "delete">): void {
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(ACCESS_TOKEN_EXP_COOKIE);
}

export async function setSession(session: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> {
  const cookieStore = await cookies();
  applySessionCookies(cookieStore, session);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  clearSessionCookies(cookieStore);
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60000;
}

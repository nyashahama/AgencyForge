"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { apiClient, type SessionUser } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";

interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends SessionState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_REFRESH_THRESHOLD = 60000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setSession = useCallback((user: SessionUser, accessToken: string) => {
    apiClient.setAccessToken(accessToken);
    setState({
      user,
      accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const clearSessionState = useCallback(() => {
    apiClient.setAccessToken(null);
    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const session = await authApi.login({ email, password });
      const expiresAt = Date.now() + session.expires_in * 1000;

      document.cookie = `af_access_token=${session.access_token}; path=/; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_refresh_token=${session.refresh_token}; path=/; httpOnly; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_access_token_exp=${expiresAt}; path=/; samesite=lax`;

      setSession(session.user, session.access_token);
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [setSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const session = await authApi.register({ name, email, password });
      const expiresAt = Date.now() + session.expires_in * 1000;

      document.cookie = `af_access_token=${session.access_token}; path=/; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_refresh_token=${session.refresh_token}; path=/; httpOnly; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_access_token_exp=${expiresAt}; path=/; samesite=lax`;

      setSession(session.user, session.access_token);
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshTokenFromCookie();
      if (refreshToken) {
        await authApi.logout({ refresh_token: refreshToken });
      }
    } catch {
    } finally {
      document.cookie = "af_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "af_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "af_access_token_exp=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      clearSessionState();
    }
  }, [clearSessionState]);

  const refreshSession = useCallback(async () => {
    const refreshToken = getRefreshTokenFromCookie();
    if (!refreshToken) {
      clearSessionState();
      return;
    }

    try {
      const session = await authApi.refresh({ refresh_token: refreshToken });
      const expiresAt = Date.now() + session.expires_in * 1000;

      document.cookie = `af_access_token=${session.access_token}; path=/; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_refresh_token=${session.refresh_token}; path=/; httpOnly; samesite=lax; ${process.env.NODE_ENV === "production" ? "secure; " : ""}`;
      document.cookie = `af_access_token_exp=${expiresAt}; path=/; samesite=lax`;

      setSession(session.user, session.access_token);
    } catch {
      document.cookie = "af_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "af_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "af_access_token_exp=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      clearSessionState();
    }
  }, [setSession, clearSessionState]);

  useEffect(() => {
    const initSession = async () => {
      const accessToken = getAccessTokenFromCookie();
      const expiresAt = getExpiresAtFromCookie();

      if (!accessToken || !expiresAt) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      if (Date.now() >= expiresAt - TOKEN_REFRESH_THRESHOLD) {
        await refreshSession();
        return;
      }

      try {
        const user = await authApi.me(accessToken);
        setSession(user, accessToken);
      } catch {
        await refreshSession();
      }
    };

    initSession();
  }, [setSession, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)af_access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)af_refresh_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getExpiresAtFromCookie(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)af_access_token_exp=([^;]*)/);
  return match ? parseInt(decodeURIComponent(match[1]), 10) : null;
}

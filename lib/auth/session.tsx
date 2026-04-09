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
  expiresAt: number | null;
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
    expiresAt: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setSession = useCallback((session: {
    user: SessionUser;
    access_token: string;
    expires_in: number;
  }) => {
    const expiresAt = Date.now() + session.expires_in * 1000;

    apiClient.setAccessToken(session.access_token);
    setState({
      user: session.user,
      accessToken: session.access_token,
      expiresAt,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const clearSessionState = useCallback(() => {
    apiClient.setAccessToken(null);
    setState({
      user: null,
      accessToken: null,
      expiresAt: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const session = await authApi.login({ email, password });
      setSession(session);
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [setSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const session = await authApi.register({ name, email, password });
      setSession(session);
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearSessionState();
    }
  }, [clearSessionState]);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authApi.session();
      setSession(session);
    } catch {
      clearSessionState();
    }
  }, [setSession, clearSessionState]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await authApi.session();
        setSession(session);
      } catch {
        clearSessionState();
      }
    };

    void initSession();
  }, [setSession, clearSessionState]);

  useEffect(() => {
    if (!state.isAuthenticated || !state.expiresAt) {
      return;
    }

    const refreshIn = Math.max(
      state.expiresAt - Date.now() - TOKEN_REFRESH_THRESHOLD,
      0,
    );

    const timeoutId = window.setTimeout(() => {
      void refreshSession();
    }, refreshIn);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshSession, state.expiresAt, state.isAuthenticated]);

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

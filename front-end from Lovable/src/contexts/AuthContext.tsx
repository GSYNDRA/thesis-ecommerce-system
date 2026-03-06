import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser, type LoginPayload } from "@/lib/api/auth.api";
import { setUnauthorizedHandler } from "@/lib/api/client";
import {
  AUTH_SESSION_STORAGE_KEY,
  clearSession,
  getSession,
  setSession,
  type AuthSession,
} from "@/lib/auth/session";

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
  setAuthSession: (session: AuthSession | null) => void;
  clearAuthSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession());

  const setAuthSession = useCallback((nextSession: AuthSession | null) => {
    if (nextSession) {
      setSession(nextSession);
      setSessionState(nextSession);
      return;
    }

    clearSession();
    setSessionState(null);
  }, []);

  const clearAuthSession = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const refresh = useCallback(async (): Promise<AuthSession | null> => {
    const currentSession = getSession();
    if (!currentSession?.accessToken || !currentSession.refreshToken) {
      clearAuthSession();
      return null;
    }

    const response = await authApi.refreshToken(
      currentSession.accessToken,
      currentSession.refreshToken,
    );

    const nextSession: AuthSession = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user || currentSession.user || null,
    };

    setAuthSession(nextSession);
    return nextSession;
  }, [clearAuthSession, setAuthSession]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthSession> => {
      const response = await authApi.login(payload);
      const nextSession: AuthSession = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user || null,
      };

      setAuthSession(nextSession);
      return nextSession;
    },
    [setAuthSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    const currentSession = getSession();

    try {
      if (currentSession?.accessToken && currentSession.refreshToken) {
        await authApi.logout(currentSession.accessToken, currentSession.refreshToken);
      }
    } catch {
      // Clear local session regardless of API outcome.
    } finally {
      clearAuthSession();
    }
  }, [clearAuthSession]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        setSessionState(getSession());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        const nextSession = await refresh();
        return nextSession?.accessToken || null;
      } catch {
        clearAuthSession();

        const currentPath =
          window.location.pathname + window.location.search + window.location.hash;
        if (!window.location.pathname.startsWith("/auth/login")) {
          const encodedReturnUrl = encodeURIComponent(currentPath || "/");
          window.location.href = `/auth/login?returnUrl=${encodedReturnUrl}&reason=session_expired`;
        }

        return null;
      }
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearAuthSession, refresh]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      user: session?.user || null,
      accessToken: session?.accessToken || null,
      refreshToken: session?.refreshToken || null,
      isAuthenticated: Boolean(session?.accessToken && session?.refreshToken),
      login,
      logout,
      refresh,
      setAuthSession,
      clearAuthSession,
    };
  }, [
    clearAuthSession,
    login,
    logout,
    refresh,
    session,
    setAuthSession,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import type { AuthUser } from "@/lib/api/auth.api";

export const AUTH_SESSION_STORAGE_KEY = "auth_session";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
}

function isValidSession(data: unknown): data is AuthSession {
  if (!data || typeof data !== "object") return false;

  const candidate = data as Partial<AuthSession>;
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === "string" &&
    candidate.refreshToken.length > 0
  );
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken || null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken || null;
}

const RESET_TOKEN_KEY = "auth_reset_token";

export function setResetToken(token: string) {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
}

export function getResetToken(): string | null {
  return sessionStorage.getItem(RESET_TOKEN_KEY);
}

export function clearResetToken() {
  sessionStorage.removeItem(RESET_TOKEN_KEY);
}

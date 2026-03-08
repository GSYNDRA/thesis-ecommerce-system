import type { AuthUser } from "@/lib/api/auth.api";

export type ChatRole = "customer" | "staff";

const CUSTOMER_ROLE_IDS = new Set<number>([1]);

function toRoleNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}

function resolveChatRoleFromUnknownRole(rawRole: unknown): ChatRole | null {
  if (typeof rawRole === "string") {
    const normalized = rawRole.trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === "customer") return "customer";
    if (normalized === "staff") return "staff";
  }

  const roleId = toRoleNumber(rawRole);
  if (roleId !== null) {
    return CUSTOMER_ROLE_IDS.has(roleId) ? "customer" : "staff";
  }

  return null;
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const token = String(accessToken || "").trim();
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");

  try {
    const raw = atob(padded);
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

export function getChatRoleFromUser(user: AuthUser | null | undefined): ChatRole | null {
  if (!user) return null;

  const roleCandidates: unknown[] = [
    user.role,
    user.role_id,
    user.roleId,
    user.role_name,
    user.roleName,
  ];

  for (const candidate of roleCandidates) {
    const mapped = resolveChatRoleFromUnknownRole(candidate);
    if (mapped) return mapped;
  }

  return null;
}

export function getChatRoleFromAccessToken(accessToken: string | null | undefined): ChatRole | null {
  if (!accessToken) return null;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;

  const roleCandidates: unknown[] = [
    payload.role,
    payload.role_id,
    payload.roleId,
    payload.role_name,
    payload.roleName,
  ];

  for (const candidate of roleCandidates) {
    const mapped = resolveChatRoleFromUnknownRole(candidate);
    if (mapped) return mapped;
  }

  return null;
}

export function getChatRoleFromSession(
  user: AuthUser | null | undefined,
  accessToken: string | null | undefined,
): ChatRole | null {
  return getChatRoleFromUser(user) || getChatRoleFromAccessToken(accessToken);
}

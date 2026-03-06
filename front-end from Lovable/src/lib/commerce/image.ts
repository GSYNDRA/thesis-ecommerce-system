import { WS_URL } from "@/lib/api/client";

export function resolveCommerceImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${WS_URL}${value}`;

  // Keep original filename/path as-is to avoid changing image source unexpectedly.
  return value;
}


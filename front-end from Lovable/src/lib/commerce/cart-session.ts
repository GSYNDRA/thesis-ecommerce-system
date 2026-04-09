import type { CartSnapshotData } from "@/lib/api/cart.api";

const CART_SNAPSHOT_STORAGE_KEY = "ecom_cart_snapshot_v1";

export function setCartSnapshot(snapshot: CartSnapshotData) {
  localStorage.setItem(CART_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
}

export function getCartSnapshot(): CartSnapshotData | null {
  const raw = localStorage.getItem(CART_SNAPSHOT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CartSnapshotData;
  } catch {
    return null;
  }
}

export function clearCartSnapshot() {
  localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
}

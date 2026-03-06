import type { AddToCartResponseData } from "@/lib/api/cart.api";

const CART_SNAPSHOT_STORAGE_KEY = "ecom_cart_snapshot_v1";

export function setCartSnapshot(snapshot: AddToCartResponseData) {
  localStorage.setItem(CART_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
}

export function getCartSnapshot(): AddToCartResponseData | null {
  const raw = localStorage.getItem(CART_SNAPSHOT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AddToCartResponseData;
  } catch {
    return null;
  }
}

export function clearCartSnapshot() {
  localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY);
}


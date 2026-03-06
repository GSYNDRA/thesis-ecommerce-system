import type { PlaceOrderData } from "@/lib/api/checkout.api";

const PENDING_ORDER_STORAGE_KEY = "ecom_pending_order_v1";

export interface PendingOrderSession {
  orderId: number;
  payUrl: string | null;
  expiresAt: number;
  amount: number;
  provider: string | null;
}

export function setPendingOrderSession(order: PlaceOrderData) {
  const expiresAt = Date.now() + Math.max(Number(order.expires_in) || 0, 0) * 1000;
  const payload: PendingOrderSession = {
    orderId: order.order_id,
    payUrl: order.payment?.pay_url || null,
    expiresAt,
    amount: Number(order.payment?.amount) || 0,
    provider: order.payment?.provider || null,
  };
  localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(payload));
}

export function getPendingOrderSession(): PendingOrderSession | null {
  const raw = localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingOrderSession;
    if (!parsed?.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      clearPendingOrderSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingOrderSession() {
  localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
}


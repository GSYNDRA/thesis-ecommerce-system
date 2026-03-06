import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/lib/api/auth.api";

export interface CheckoutPreviewPayload {
  cart_id: number;
  shipping_fee?: number;
  system_discount_code?: string;
  shipping_discount_code?: string;
}

export interface CheckoutPreviewItem {
  variation_id: number;
  quantity: number;
  price: number;
  line_total: number;
  stock_remaining: number;
  stock_reserved: number;
  stock_available: number;
  product: {
    id: number;
    name: string;
    slug: string;
  } | null;
  size: {
    id: number;
    name: string;
  } | null;
  colour: {
    id: number;
    name: string;
  } | null;
  image: {
    id: number;
    image_filename: string;
  } | null;
}

export interface VoucherItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  valid_from: string;
  valid_to: string;
  estimated_discount: number;
  is_selected: boolean;
}

export interface CheckoutPreviewData {
  cart_id: number;
  discount_mode: "auto" | "manual";
  items: CheckoutPreviewItem[];
  checkout_order: {
    totalPrice: number;
    feeShip: number;
    totalDiscount: number;
    totalCheckout: number;
  };
  applied_discounts: {
    mode: "auto" | "manual";
    system_discount: {
      code: string;
      type: string;
      value: number;
      amount: number;
    } | null;
    shipping_discount: {
      code: string;
      type: string;
      value: number;
      amount: number;
    } | null;
    totalDiscount: number;
  };
  available_vouchers: {
    system: VoucherItem[];
    shipping: VoucherItem[];
  };
}

export interface PlaceOrderData {
  is_idempotent?: boolean;
  order_id: number;
  status: string;
  expires_in: number;
  payment: {
    provider: string;
    request_id: string | null;
    order_id: string | null;
    amount: number;
    pay_url: string | null;
    deeplink: string | null;
    qr_code_url: string | null;
    result_code: number | null;
    message: string | null;
  };
  order?: {
    id?: number;
    order_status?: string;
    [key: string]: unknown;
  };
  checkout?: CheckoutPreviewData;
}

export interface OrderStatusData {
  order_id: number;
  order_number: string;
  order_status: string;
  payment_status: string;
  payment_provider: string | null;
  payment_transaction_id: string | null;
  amount: number;
  checkout_state: "pending" | "success" | "failed";
  is_final: boolean;
  updated_at: string;
}

function buildPreviewQuery(payload: CheckoutPreviewPayload) {
  const params = new URLSearchParams();
  params.set("cart_id", String(payload.cart_id));
  if (payload.shipping_fee !== undefined) params.set("shipping_fee", String(payload.shipping_fee));
  if (payload.system_discount_code) params.set("system_discount_code", payload.system_discount_code);
  if (payload.shipping_discount_code) params.set("shipping_discount_code", payload.shipping_discount_code);
  return params.toString();
}

export const checkoutApi = {
  preview(payload: CheckoutPreviewPayload, accessToken?: string | null) {
    const query = buildPreviewQuery(payload);
    return apiClient.get<ApiSuccessResponse<CheckoutPreviewData>>(
      `/checkout/preview?${query}`,
      { accessToken: accessToken || undefined },
    );
  },

  placeOrder(payload: CheckoutPreviewPayload, accessToken?: string | null) {
    return apiClient.post<ApiSuccessResponse<PlaceOrderData>>(
      "/checkout/place-order",
      payload,
      { accessToken: accessToken || undefined },
    );
  },

  getOrderStatus(orderId: number, accessToken?: string | null) {
    return apiClient.get<ApiSuccessResponse<OrderStatusData>>(
      `/checkout/order-status/${orderId}`,
      { accessToken: accessToken || undefined },
    );
  },
};

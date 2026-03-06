import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/lib/api/auth.api";

export interface AddToCartPayload {
  variationId: number;
  quantity: number;
}

export interface AddToCartResponseData {
  cart_id: number;
  cart_total_items: number;
  cart_subtotal: number;
  cart_items: Array<{
    variation_id: number;
    quantity: number;
    price: number;
    variant: unknown;
  }>;
}

export const cartApi = {
  addToCart(payload: AddToCartPayload, accessToken?: string | null) {
    return apiClient.post<ApiSuccessResponse<AddToCartResponseData>>(
      "/cart/add",
      payload,
      { accessToken: accessToken || undefined },
    );
  },
};


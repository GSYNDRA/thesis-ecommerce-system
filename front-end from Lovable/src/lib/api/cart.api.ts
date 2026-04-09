import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/lib/api/auth.api";

export interface AddToCartPayload {
  variationId: number;
  quantity: number;
}

export interface CartItemData {
  cart_item_id?: number;
  variation_id: number;
  quantity: number;
  price: number;
  variant: unknown;
}

export interface CartSnapshotData {
  cart_id: number | null;
  cart_total_items: number;
  cart_subtotal: number;
  cart_items: CartItemData[];
}

export interface UpdateCartItemQuantityPayload {
  quantity: number;
}

export const cartApi = {
  addToCart(payload: AddToCartPayload, accessToken?: string | null) {
    return apiClient.post<ApiSuccessResponse<CartSnapshotData>>(
      "/cart/add",
      payload,
      { accessToken: accessToken || undefined },
    );
  },

  getCart(accessToken?: string | null) {
    return apiClient.get<ApiSuccessResponse<CartSnapshotData>>("/cart", {
      accessToken: accessToken || undefined,
    });
  },

  updateCartItemQuantity(
    cartItemId: number,
    payload: UpdateCartItemQuantityPayload,
    accessToken?: string | null,
  ) {
    return apiClient.patch<ApiSuccessResponse<CartSnapshotData>>(
      `/cart/items/${encodeURIComponent(String(cartItemId))}`,
      payload,
      { accessToken: accessToken || undefined },
    );
  },

  removeCartItem(cartItemId: number, accessToken?: string | null) {
    return apiClient.delete<ApiSuccessResponse<CartSnapshotData>>(
      `/cart/items/${encodeURIComponent(String(cartItemId))}`,
      { accessToken: accessToken || undefined },
    );
  },
};

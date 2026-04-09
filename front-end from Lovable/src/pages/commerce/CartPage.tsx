import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cartApi, type CartItemData, type CartSnapshotData } from "@/lib/api/cart.api";
import { clearCartSnapshot, getCartSnapshot, setCartSnapshot } from "@/lib/commerce/cart-session";
import { clearPendingOrderSession, getPendingOrderSession } from "@/lib/commerce/order-session";
import { resolveCommerceImageUrl } from "@/lib/commerce/image";
import { checkoutApi, type OrderStatusData } from "@/lib/api/checkout.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, Loader2, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function isCartEmpty(snapshot: CartSnapshotData | null): boolean {
  return !snapshot || !Array.isArray(snapshot.cart_items) || snapshot.cart_items.length === 0;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [cartSnapshot, setCartSnapshotState] = useState<CartSnapshotData | null>(() =>
    getCartSnapshot(),
  );
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState(() => getPendingOrderSession());
  const [orderStatus, setOrderStatus] = useState<OrderStatusData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const isCartLocked = Boolean(
    pendingOrder &&
      (!orderStatus || !orderStatus.is_final),
  );

  const applyCartSnapshot = useCallback((snapshot: CartSnapshotData | null) => {
    setCartSnapshotState(snapshot);
    if (snapshot && snapshot.cart_id && snapshot.cart_items?.length) {
      setCartSnapshot(snapshot);
      return;
    }
    clearCartSnapshot();
  }, []);

  const fetchCart = useCallback(async () => {
    setLoadingCart(true);
    setError(null);
    try {
      const response = await cartApi.getCart(accessToken);
      applyCartSnapshot(response.data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load cart.");
    } finally {
      setLoadingCart(false);
    }
  }, [accessToken, applyCartSnapshot]);

  const pollPendingOrderStatus = useCallback(async () => {
    if (!pendingOrder?.orderId) return;
    setCheckingStatus(true);
    try {
      const response = await checkoutApi.getOrderStatus(pendingOrder.orderId, accessToken);
      const status = response.data;
      setOrderStatus(status);

      if (status.is_final) {
        if (status.checkout_state === "success") {
          clearCartSnapshot();
        }
        clearPendingOrderSession();
        setPendingOrder(null);
        await fetchCart();
      }
    } catch {
      // Keep local lock state until next successful poll.
    } finally {
      setCheckingStatus(false);
    }
  }, [accessToken, fetchCart, pendingOrder?.orderId]);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!pendingOrder?.orderId) return;

    let timerId: number | null = null;
    void pollPendingOrderStatus();
    timerId = window.setInterval(() => {
      void pollPendingOrderStatus();
    }, 3000);

    return () => {
      if (timerId) window.clearInterval(timerId);
    };
  }, [pollPendingOrderStatus, pendingOrder?.orderId]);

  async function onChangeQuantity(item: CartItemData, nextQuantity: number) {
    if (isCartLocked) {
      toast.error("This cart is currently locked due to a pending payment.");
      return;
    }

    const cartItemId = Number(item.cart_item_id || 0);
    if (!cartItemId) {
      toast.error("Cart item id is missing. Please refresh cart.");
      return;
    }

    if (nextQuantity <= 0) {
      await onRemoveItem(item);
      return;
    }

    setUpdatingItemId(cartItemId);
    try {
      const response = await cartApi.updateCartItemQuantity(
        cartItemId,
        { quantity: nextQuantity },
        accessToken,
      );
      applyCartSnapshot(response.data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Failed to update quantity.");
      } else {
        toast.error("Failed to update quantity.");
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function onRemoveItem(item: CartItemData) {
    if (isCartLocked) {
      toast.error("This cart is currently locked due to a pending payment.");
      return;
    }

    const cartItemId = Number(item.cart_item_id || 0);
    if (!cartItemId) {
      toast.error("Cart item id is missing. Please refresh cart.");
      return;
    }

    setRemovingItemId(cartItemId);
    try {
      const response = await cartApi.removeCartItem(cartItemId, accessToken);
      applyCartSnapshot(response.data);
      setError(null);
      toast.success("Item removed from cart.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Failed to remove cart item.");
      } else {
        toast.error("Failed to remove cart item.");
      }
    } finally {
      setRemovingItemId(null);
    }
  }

  if (loadingCart && isCartEmpty(cartSnapshot)) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!loadingCart && isCartEmpty(cartSnapshot)) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add products from catalog first.
          </p>
          <Button className="mt-5" onClick={() => navigate("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl font-semibold">Cart</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void fetchCart()} disabled={loadingCart}>
            {loadingCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Link className="text-sm text-accent hover:underline" to="/products">
            Continue shopping
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isCartLocked ? (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-warning-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Cart #{cartSnapshot?.cart_id ?? "-"} is locked for payment (Order #{pendingOrder?.orderId})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payment is in progress. You cannot start another checkout with this cart until payment is completed or failed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingOrder?.payUrl ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      window.open(pendingOrder.payUrl!, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Resume Payment
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => void pollPendingOrderStatus()} disabled={checkingStatus}>
                  {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Refresh Status
                </Button>
                {orderStatus ? (
                  <span className="self-center text-xs text-muted-foreground">
                    Status: {orderStatus.order_status} / {orderStatus.payment_status}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className={`space-y-4 lg:col-span-2 ${isCartLocked ? "opacity-80" : ""}`}>
          {(cartSnapshot?.cart_items || []).map((item) => {
            const variant = item.variant as
              | {
                  qty_in_stock?: number;
                  product_item?: {
                    product?: { product_name?: string };
                    colour?: { colour_name?: string };
                    product_images?: Array<{ image_filename?: string }>;
                  };
                  size?: { size_name?: string };
                }
              | null;
            const name = variant?.product_item?.product?.product_name || `Variation #${item.variation_id}`;
            const size = variant?.size?.size_name || "-";
            const colour = variant?.product_item?.colour?.colour_name || "-";
            const imageUrl = resolveCommerceImageUrl(
              variant?.product_item?.product_images?.[0]?.image_filename || null,
            );
            const cartItemId = Number(item.cart_item_id || 0);
            const maxQty = Math.max(1, Number(variant?.qty_in_stock || item.quantity || 1));
            const isUpdating = updatingItemId === cartItemId;
            const isRemoving = removingItemId === cartItemId;

            return (
              <article key={cartItemId || item.variation_id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <div className="h-24 w-20 overflow-hidden rounded-md bg-secondary">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-serif text-xl font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {colour} / {size}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <button
                        className="px-2 py-1"
                        disabled={isCartLocked || isUpdating || isRemoving || item.quantity <= 1}
                        onClick={() => void onChangeQuantity(item, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 px-2 text-center">{item.quantity}</span>
                      <button
                        className="px-2 py-1"
                        disabled={isCartLocked || isUpdating || isRemoving || item.quantity >= maxQty}
                        onClick={() => void onChangeQuantity(item, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Stock: {maxQty}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      disabled={isCartLocked || isUpdating || isRemoving}
                      onClick={() => void onRemoveItem(item)}
                    >
                      {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <p className="font-serif text-xl font-semibold">Summary</p>
          <p className="mt-1 text-xs text-muted-foreground">Cart ID: {cartSnapshot?.cart_id ?? "-"}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <Badge variant="secondary">{cartSnapshot?.cart_total_items || 0}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(cartSnapshot?.cart_subtotal || 0)}</span>
          </div>
          <Separator className="my-4" />
          <Button
            className="w-full"
            onClick={() => navigate("/checkout")}
            disabled={isCartLocked || isCartEmpty(cartSnapshot)}
          >
            {isCartLocked ? "Cart Locked by Pending Payment" : "Proceed to Checkout"}
          </Button>
          <Button
            className="mt-2 w-full"
            variant="outline"
            disabled={loadingCart}
            onClick={() => void fetchCart()}
          >
            Refresh Cart
          </Button>
        </aside>
      </div>
    </div>
  );
}


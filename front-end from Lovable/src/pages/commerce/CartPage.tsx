import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { clearCartSnapshot, getCartSnapshot } from "@/lib/commerce/cart-session";
import { clearPendingOrderSession, getPendingOrderSession } from "@/lib/commerce/order-session";
import { resolveCommerceImageUrl } from "@/lib/commerce/image";
import { checkoutApi, type OrderStatusData } from "@/lib/api/checkout.api";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, ExternalLink, Lock, Loader2 } from "lucide-react";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function CartPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const cartSnapshot = getCartSnapshot();
  const [pendingOrder, setPendingOrder] = useState(() => getPendingOrderSession());
  const [orderStatus, setOrderStatus] = useState<OrderStatusData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const isCartLocked = Boolean(
    pendingOrder &&
      (!orderStatus || !orderStatus.is_final),
  );

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
      }
    } catch {
      // Keep local lock state until next successful poll.
    } finally {
      setCheckingStatus(false);
    }
  }, [accessToken, pendingOrder?.orderId]);

  useEffect(() => {
    if (!pendingOrder?.orderId) return;

    let timerId: number | null = null;
    pollPendingOrderStatus();
    timerId = window.setInterval(() => {
      pollPendingOrderStatus();
    }, 3000);

    return () => {
      if (timerId) window.clearInterval(timerId);
    };
  }, [pollPendingOrderStatus, pendingOrder?.orderId]);

  if (!cartSnapshot || !cartSnapshot.cart_items?.length) {
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
        <Link className="text-sm text-accent hover:underline" to="/products">
          Continue shopping
        </Link>
      </div>

      {isCartLocked ? (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-warning-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Cart #{cartSnapshot.cart_id} is locked for payment (Order #{pendingOrder?.orderId})
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
                <Button size="sm" variant="outline" onClick={pollPendingOrderStatus} disabled={checkingStatus}>
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
          {cartSnapshot.cart_items.map((item) => {
            const variant = item.variant as
              | {
                  product_item?: {
                    product?: { product_name?: string; product_slug?: string };
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

            return (
              <article key={item.variation_id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
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
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <p className="font-serif text-xl font-semibold">Summary</p>
          <p className="mt-1 text-xs text-muted-foreground">Cart ID: {cartSnapshot.cart_id}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <Badge variant="secondary">{cartSnapshot.cart_total_items}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(cartSnapshot.cart_subtotal)}</span>
          </div>
          <Separator className="my-4" />
          <Button className="w-full" onClick={() => navigate("/checkout")} disabled={isCartLocked}>
            {isCartLocked ? "Cart Locked by Pending Payment" : "Proceed to Checkout"}
          </Button>
          <Button
            className="mt-2 w-full"
            variant="outline"
            disabled={isCartLocked}
            onClick={() => {
              clearCartSnapshot();
              clearPendingOrderSession();
              navigate("/products");
            }}
          >
            Clear Cart Snapshot
          </Button>
        </aside>
      </div>
    </div>
  );
}

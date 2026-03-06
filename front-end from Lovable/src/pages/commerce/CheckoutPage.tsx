import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  checkoutApi,
  type CheckoutPreviewData,
  type OrderStatusData,
  type VoucherItem,
} from "@/lib/api/checkout.api";
import { ApiError } from "@/lib/api/client";
import { clearCartSnapshot, getCartSnapshot } from "@/lib/commerce/cart-session";
import { resolveCommerceImageUrl } from "@/lib/commerce/image";
import {
  clearPendingOrderSession,
  getPendingOrderSession,
  setPendingOrderSession,
} from "@/lib/commerce/order-session";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const cartSnapshot = getCartSnapshot();
  const pendingSession = getPendingOrderSession();

  const [preview, setPreview] = useState<CheckoutPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData | null>(null);
  const [finalPaymentState, setFinalPaymentState] = useState<"success" | "failed" | null>(null);
  const [pollingStatus, setPollingStatus] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [shippingFee, setShippingFee] = useState(40);
  const [systemCode, setSystemCode] = useState("");
  const [shippingCode, setShippingCode] = useState("");
  const [waitingOrder, setWaitingOrder] = useState<{
    orderId: number;
    payUrl: string | null;
    expiresAt: number;
  } | null>(() => {
    if (!pendingSession) return null;
    return {
      orderId: pendingSession.orderId,
      payUrl: pendingSession.payUrl,
      expiresAt: pendingSession.expiresAt,
    };
  });
  const hasNotifiedFinalRef = useRef(false);

  const cartId = cartSnapshot?.cart_id || null;

  const loadPreview = useCallback(
    async (next?: { systemCode?: string; shippingCode?: string; shippingFee?: number }) => {
      if (!cartId) return;

      const system = next?.systemCode ?? systemCode;
      const shipping = next?.shippingCode ?? shippingCode;
      const fee = next?.shippingFee ?? shippingFee;

      setLoading(true);
      setError(null);
      try {
        const response = await checkoutApi.preview(
          {
            cart_id: cartId,
            shipping_fee: fee,
            system_discount_code: system || undefined,
            shipping_discount_code: shipping || undefined,
          },
          accessToken,
        );
        setPreview(response.data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError("Failed to load checkout preview.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, cartId, shippingCode, shippingFee, systemCode],
  );

  useEffect(() => {
    if (!cartId) {
      setLoading(false);
      return;
    }
    loadPreview();
  }, [cartId, loadPreview]);

  const pollOrderStatus = useCallback(
    async (orderId: number) => {
      setPollingStatus(true);
      try {
        const response = await checkoutApi.getOrderStatus(orderId, accessToken);
        const statusData = response.data;
        setOrderStatus(statusData);

        if (statusData.is_final && !hasNotifiedFinalRef.current) {
          hasNotifiedFinalRef.current = true;
          setWaitingOrder(null);

          if (statusData.checkout_state === "success") {
            clearPendingOrderSession();
            clearCartSnapshot();
            setFinalPaymentState("success");
            toast.success("Payment completed successfully.");
          } else {
            clearPendingOrderSession();
            setFinalPaymentState("failed");
            toast.error("Payment failed or order was cancelled.");
          }
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      } finally {
        setPollingStatus(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!waitingOrder?.orderId) return;

    let isActive = true;
    let timerId: number | null = null;

    const run = async () => {
      if (!isActive) return;
      await pollOrderStatus(waitingOrder.orderId);
    };

    run();
    timerId = window.setInterval(run, 3000);

    return () => {
      isActive = false;
      if (timerId) window.clearInterval(timerId);
    };
  }, [pollOrderStatus, waitingOrder?.orderId]);

  useEffect(() => {
    if (!waitingOrder?.orderId) return;

    const handleFocus = () => {
      pollOrderStatus(waitingOrder.orderId);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pollOrderStatus(waitingOrder.orderId);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "ecom_payment_return_event" || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as { orderId?: number };
        if (!payload?.orderId || payload.orderId !== waitingOrder.orderId) return;
      } catch {
        // Ignore malformed payload.
      }
      pollOrderStatus(waitingOrder.orderId);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, [pollOrderStatus, waitingOrder?.orderId]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const canPlaceOrder = useMemo(
    () => Boolean(preview?.cart_id) && !loading && !placing && !waitingOrder,
    [preview, loading, placing, waitingOrder],
  );
  const remainingSeconds = useMemo(() => {
    if (!waitingOrder) return 0;
    return Math.max(0, Math.ceil((waitingOrder.expiresAt - now) / 1000));
  }, [waitingOrder, now]);

  if (!cartId && !waitingOrder) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="font-serif text-3xl font-semibold">No cart snapshot found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add items to cart first from product detail page.
          </p>
          <Button className="mt-4" onClick={() => navigate("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  async function placeOrder() {
    if (!preview?.cart_id) return;

    setPlacing(true);
    try {
      const response = await checkoutApi.placeOrder(
        {
          cart_id: preview.cart_id,
          shipping_fee: shippingFee,
          system_discount_code: systemCode || undefined,
          shipping_discount_code: shippingCode || undefined,
        },
        accessToken,
      );

      const order = response.data;
      if (order.payment?.pay_url) {
        hasNotifiedFinalRef.current = false;
        setFinalPaymentState(null);
        setPendingOrderSession(order);
        setWaitingOrder({
          orderId: order.order_id,
          payUrl: order.payment.pay_url,
          expiresAt: Date.now() + Math.max(Number(order.expires_in) || 0, 0) * 1000,
        });
        setOrderStatus(null);

        const popup = window.open(order.payment.pay_url, "_blank", "noopener,noreferrer");
        if (!popup) {
          toast.message("Payment page blocked by browser popup settings. Use the manual button.");
        } else {
          toast.success("Payment page opened in a new tab. Waiting for result...");
        }
        return;
      }

      if (order.is_idempotent) {
        const existingOrderId = Number(order.order?.id) || 0;
        if (existingOrderId > 0) {
          setFinalPaymentState(null);
          setWaitingOrder((prev) => ({
            orderId: existingOrderId,
            payUrl: prev?.payUrl || null,
            expiresAt: prev?.expiresAt || Date.now() + 30000,
          }));
          toast.message("Existing pending order detected. Status polling resumed.");
          return;
        }
        toast.message("Existing pending order detected.");
        return;
      }

      toast.error("Order created but no payment URL returned.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to place order.");
    } finally {
      setPlacing(false);
    }
  }

  function applySystemVoucher(voucher: VoucherItem) {
    setSystemCode(voucher.code);
    loadPreview({ systemCode: voucher.code });
  }

  function applyShippingVoucher(voucher: VoucherItem) {
    setShippingCode(voucher.code);
    loadPreview({ shippingCode: voucher.code });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl font-semibold">Checkout</h1>
        <Link to="/cart" className="text-sm text-accent hover:underline">
          Back to Cart
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button className="mt-3" variant="outline" onClick={() => loadPreview()}>
            Retry
          </Button>
        </div>
      ) : null}

      {finalPaymentState ? (
        <div
          className={`mb-6 rounded-lg border p-4 ${
            finalPaymentState === "success"
              ? "border-success/30 bg-success/10"
              : "border-destructive/30 bg-destructive/10"
          }`}
        >
          <p className="font-medium">
            {finalPaymentState === "success"
              ? "Payment successful. Your order is confirmed."
              : "Payment failed or reservation expired."}
          </p>
          <div className="mt-3 flex gap-2">
            {finalPaymentState === "success" ? (
              <Button variant="outline" onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/cart")}>
                Back to Cart
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {waitingOrder ? (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                Waiting payment for order #{waitingOrder.orderId}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Current status:{" "}
                <span className="font-medium">
                  {orderStatus
                    ? `${orderStatus.order_status} / ${orderStatus.payment_status}`
                    : pollingStatus
                      ? "checking..."
                      : "pending"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Reservation remaining: {remainingSeconds}s
              </p>
            </div>
            <div className="flex gap-2">
              {waitingOrder.payUrl ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(waitingOrder.payUrl!, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Payment Page
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => pollOrderStatus(waitingOrder.orderId)}>
                {pollingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && preview ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-serif text-2xl font-semibold">Order Items</h2>
              <p className="mt-1 text-xs text-muted-foreground">Cart #{preview.cart_id}</p>

              <div className="mt-4 space-y-3">
                {preview.items.map((item) => (
                  <article key={item.variation_id} className="flex gap-4 rounded-md border border-border p-3">
                    <div className="h-24 w-20 overflow-hidden rounded bg-secondary">
                      {resolveCommerceImageUrl(item.image?.image_filename) ? (
                        <img
                          src={resolveCommerceImageUrl(item.image?.image_filename) || ""}
                          alt={item.product?.name || `Variation ${item.variation_id}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.colour?.name || "-"} / {item.size?.name || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} • Stock available {item.stock_available}
                      </p>
                      <p className="mt-1 text-sm font-medium">{formatMoney(item.line_total)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-serif text-2xl font-semibold">Discounts</h2>
              <p className="mt-1 text-xs text-muted-foreground">Mode: {preview.discount_mode}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    System Discount Code
                  </p>
                  <div className="flex gap-2">
                    <Input value={systemCode} onChange={(e) => setSystemCode(e.target.value)} placeholder="e.g. WELCOME20" />
                    <Button variant="outline" onClick={() => loadPreview({ systemCode })}>
                      Apply
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.available_vouchers.system.map((voucher) => (
                      <button
                        key={voucher.id}
                        className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                        onClick={() => applySystemVoucher(voucher)}
                      >
                        {voucher.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Shipping Discount Code
                  </p>
                  <div className="flex gap-2">
                    <Input value={shippingCode} onChange={(e) => setShippingCode(e.target.value)} placeholder="e.g. FREESHIP" />
                    <Button variant="outline" onClick={() => loadPreview({ shippingCode })}>
                      Apply
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.available_vouchers.shipping.map((voucher) => (
                      <button
                        key={voucher.id}
                        className="rounded border border-border px-2 py-1 text-xs hover:border-accent"
                        onClick={() => applyShippingVoucher(voucher)}
                      >
                        {voucher.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-lg border border-border bg-card p-5">
            <h2 className="font-serif text-2xl font-semibold">Summary</h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(preview.checkout_order.totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span>{formatMoney(preview.checkout_order.feeShip)}</span>
              </div>
              <div className="flex items-center justify-between text-success">
                <span>Total Discount</span>
                <span>-{formatMoney(preview.checkout_order.totalDiscount)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between font-serif text-2xl font-semibold">
              <span>Total</span>
              <span>{formatMoney(preview.checkout_order.totalCheckout)}</span>
            </div>

            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Applied system:{" "}
                <Badge variant="secondary">
                  {preview.applied_discounts.system_discount?.code || "None"}
                </Badge>
              </p>
              <p>
                Applied shipping:{" "}
                <Badge variant="secondary">
                  {preview.applied_discounts.shipping_discount?.code || "None"}
                </Badge>
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Custom Shipping Fee
              </p>
              <Input
                type="number"
                min={0}
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
              />
              <Button className="mt-2 w-full" variant="outline" onClick={() => loadPreview({ shippingFee })}>
                Recalculate
              </Button>
            </div>

            <Button className="mt-4 w-full" disabled={!canPlaceOrder} onClick={placeOrder}>
              {placing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              {placing ? "Placing order..." : "Place Order & Pay"}
            </Button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { clearCartSnapshot } from "@/lib/commerce/cart-session";
import { clearPendingOrderSession, getPendingOrderSession } from "@/lib/commerce/order-session";

function parseResultCode(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function CheckoutResultPage() {
  const [params] = useSearchParams();
  const pendingOrder = getPendingOrderSession();

  const resultCode = parseResultCode(params.get("resultCode") || params.get("result_code"));
  const message = params.get("message") || "";
  const orderId = params.get("orderId") || params.get("order_id") || String(pendingOrder?.orderId || "");

  const state = useMemo<"success" | "failed" | "unknown">(() => {
    if (resultCode === 0) return "success";
    if (resultCode !== null && resultCode !== 0) return "failed";
    return "unknown";
  }, [resultCode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "ecom_payment_return_event",
        JSON.stringify({
          at: Date.now(),
          orderId: orderId ? Number(orderId) || null : null,
          resultCode,
          state,
        }),
      );
    } catch {
      // Ignore storage errors.
    }

    if (state === "success") {
      clearPendingOrderSession();
      clearCartSnapshot();
      return;
    }

    if (state === "failed") {
      clearPendingOrderSession();
    }
  }, [orderId, resultCode, state]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        {state === "success" ? (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
        ) : null}
        {state === "failed" ? (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-9 w-9 text-destructive" />
          </div>
        ) : null}
        {state === "unknown" ? (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-9 w-9 text-warning-foreground" />
          </div>
        ) : null}

        <h1 className="font-serif text-4xl font-semibold">
          {state === "success" ? "Payment Successful" : null}
          {state === "failed" ? "Payment Failed" : null}
          {state === "unknown" ? "Payment Processing" : null}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          {message || "Payment status returned from provider redirect."}
        </p>

        {orderId ? <p className="mt-2 text-xs text-muted-foreground">Order: {orderId}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {state === "success" ? (
            <>
              <Button asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </>
          ) : null}

          {state === "failed" ? (
            <>
              <Button asChild>
                <Link to="/checkout">Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cart">Back to Cart</Link>
              </Button>
            </>
          ) : null}

          {state === "unknown" ? (
            <>
              <Button asChild>
                <Link to="/cart">Back to Cart</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

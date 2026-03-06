import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag, Plus, Minus, X, Loader2, AlertCircle, CheckCircle, Tag,
  ArrowLeft, Truck, Clock, Lock, ExternalLink, AlertTriangle, CreditCard, ShieldCheck
} from "lucide-react";

/* ── Shared helpers ── */
const InlineError = ({ msg }: { msg: string }) => (
  <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{msg}</span>
  </div>
);
const InlineSuccess = ({ msg }: { msg: string }) => (
  <div className="flex items-start gap-2 text-success text-sm bg-success/5 border border-success/20 rounded-md px-3 py-2">
    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{msg}</span>
  </div>
);
const InlineWarning = ({ msg }: { msg: string }) => (
  <div className="flex items-start gap-2 text-warning-foreground text-sm bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>{msg}</span>
  </div>
);
const SpecTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto border border-border rounded-lg">
    <table className="w-full text-sm">
      <thead><tr className="bg-secondary/50 border-b border-border">
        {headers.map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">{h}</th>)}
      </tr></thead>
      <tbody>{rows.map((row, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {row.map((cell, j) => <td key={j} className="px-4 py-2 text-xs">{cell}</td>)}
        </tr>
      ))}</tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 1: ADD TO CART (Product Detail Context)
   POST /api/v1/cart/add { variationId, quantity }
   ═══════════════════════════════════════════════════ */
const AddToCartScreen = ({ state = "default" }: { state?: "default" | "loading" | "success" | "error" | "out-of-stock" }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-sm">
      <div className="aspect-[3/4] bg-secondary rounded-md mb-4 flex items-center justify-center text-muted-foreground font-serif">[Product Image]</div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Maison Collection</p>
      <p className="font-serif text-xl font-semibold mt-1">Silk Evening Dress</p>
      <p className="font-serif text-lg font-medium mt-1">$1,280.00</p>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {["XS", "S", "M", "L"].map((s) => (
            <button key={s} className={`w-10 h-10 rounded-md border text-xs font-medium ${s === "M" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{s}</button>
          ))}
          <button className="w-10 h-10 rounded-md border border-border text-xs text-muted-foreground line-through opacity-40" disabled>XL</button>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-border rounded-md">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-secondary"><Minus className="w-4 h-4" /></button>
            <span className="w-10 text-center text-sm font-medium">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-secondary"><Plus className="w-4 h-4" /></button>
          </div>
          <span className="text-xs text-muted-foreground">variationId: 1042</span>
        </div>

        {state === "error" && <InlineError msg="Failed to add to cart. Please try again." />}
        {state === "out-of-stock" && <InlineError msg="This item is currently out of stock." />}
        {state === "success" && <InlineSuccess msg="Added to cart! Cart now has 3 items." />}

        <Button className="w-full" disabled={state === "loading" || state === "out-of-stock"}>
          {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          <ShoppingBag className="w-4 h-4" />
          {state === "loading" ? "Adding…" : state === "out-of-stock" ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SCREEN 2: CART PAGE
   Based on cart snapshot from /cart/add response
   ═══════════════════════════════════════════════════ */
const CartPage = ({ state = "default" }: { state?: "default" | "empty" | "locked" }) => {
  if (state === "empty") {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-serif text-2xl font-semibold mb-2">Your Cart is Empty</p>
        <p className="text-sm text-muted-foreground mb-4">Browse our collection and add items you love.</p>
        <Button>Browse Collection</Button>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Lock className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium text-sm">Cart Locked</p>
            <p className="text-xs text-muted-foreground mt-1">You have a pending payment for this cart. Complete or cancel the existing payment to modify your cart.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm">Complete Payment</Button>
              <Button size="sm" variant="outline">Cancel Pending Order</Button>
            </div>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">
          <CartItemsList />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-serif text-xl font-semibold">Shopping Cart</p>
          <Badge variant="secondary">3 items</Badge>
        </div>
        <CartItemsList />
        <div className="mt-4 text-xs text-muted-foreground">
          <p>cart_id: abc-123 · cart_subtotal from last /cart/add response</p>
          <p className="mt-1">⚠ No cart list/update/remove API available yet — display read-only snapshot.</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 h-fit shadow-sm">
        <p className="font-serif text-lg font-semibold mb-4">Cart Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (3 items)</span><span>$3,480.00</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-muted-foreground">Calculated at checkout</span></div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-serif text-lg font-semibold">
          <span>Subtotal</span><span>$3,480.00</span>
        </div>
        <Button className="w-full mt-4">Proceed to Checkout</Button>
        <p className="text-[10px] text-center text-muted-foreground mt-2">Calls GET /api/v1/checkout/preview with cart_id</p>
      </div>
    </div>
  );
};

const CartItemsList = () => (
  <div className="space-y-0">
    {[
      { name: "Silk Evening Dress", variant: "Black / M", price: "$1,280.00", qty: 1 },
      { name: "Cashmere Blazer", variant: "Ivory / S", price: "$890.00", qty: 2 },
      { name: "Leather Clutch", variant: "Burgundy", price: "$420.00", qty: 1 },
    ].map((item) => (
      <div key={item.name} className="flex items-center gap-4 py-4 border-b border-border last:border-0">
        <div className="w-20 h-24 bg-secondary rounded-md flex items-center justify-center text-xs text-muted-foreground">[img]</div>
        <div className="flex-1">
          <p className="font-serif font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.variant}</p>
          <p className="text-sm font-medium mt-1">{item.price}</p>
        </div>
        <span className="text-sm text-muted-foreground">×{item.qty}</span>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 3: CHECKOUT PAGE
   GET /api/v1/checkout/preview { cart_id, shipping_fee?, system_discount_code?, shipping_discount_code? }
   ═══════════════════════════════════════════════════ */
const CheckoutPage = ({ state = "default" }: { state?: "default" | "loading" | "stock-error" | "voucher-error" }) => (
  <div className="grid grid-cols-3 gap-8">
    <div className="col-span-2 space-y-6">
      {state === "loading" && (
        <div className="bg-card border border-border rounded-lg p-12 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Loading checkout preview…</span>
        </div>
      )}

      {state !== "loading" && (
        <>
          {state === "stock-error" && (
            <InlineWarning msg="Some items have limited stock. Cashmere Blazer: only 1 left (you requested 2)." />
          )}

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="font-serif text-lg font-semibold mb-4">Order Items</p>
            <CartItemsList />
            {state === "stock-error" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-warning-foreground">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stock is checked from checkout_preview response item.stock fields</span>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="font-serif text-lg font-semibold mb-4">Apply Voucher</p>
            <div className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Enter voucher code" />
              </div>
              <Button variant="outline">Apply</Button>
            </div>
            {state === "voucher-error" && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Voucher code is invalid or has expired.</p>
            )}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Available Vouchers (from preview response)</p>
              <div className="flex gap-2">
                {["WELCOME20", "FREESHIP"].map((v) => (
                  <button key={v} className="border border-border rounded-md px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent transition-colors">{v}</button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">discount_mode: auto | manual — from preview response</p>
          </div>
        </>
      )}
    </div>

    <div className="bg-card border border-border rounded-lg p-6 h-fit shadow-sm">
      <p className="font-serif text-lg font-semibold mb-4">Order Summary</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>$3,480.00</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping (feeShip)</span><span>$15.00</span></div>
        <div className="flex justify-between text-success"><span>Discount (totalDiscount)</span><span>−$518.00</span></div>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between font-serif text-xl font-bold">
        <span>Total</span><span>$2,977.00</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">checkout_order.totalCheckout from preview</p>
      <Button className="w-full mt-4" disabled={state === "loading"}>
        {state === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : "Place Order & Pay"}
      </Button>
      <p className="text-[10px] text-center text-muted-foreground mt-2">Calls POST /api/v1/checkout/place-order</p>
      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <ShieldCheck className="w-3 h-3" /> Secure checkout
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 4: PAYMENT REDIRECT HANDOFF
   POST /api/v1/checkout/place-order → payment.pay_url
   ═══════════════════════════════════════════════════ */
const PaymentRedirectScreen = ({ state = "redirecting" }: { state?: "redirecting" | "error" | "idempotent" }) => (
  <div className="bg-card border border-border rounded-lg p-12 max-w-lg mx-auto text-center space-y-4">
    {state === "redirecting" && (
      <>
        <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
        <p className="font-serif text-2xl font-semibold">Redirecting to Payment</p>
        <p className="text-sm text-muted-foreground">You're being redirected to MoMo to complete your payment.</p>
        <div className="bg-secondary/50 rounded-md p-4 text-xs text-muted-foreground space-y-1">
          <p>order_id: ORD-38291</p>
          <p>expires_in: 300s (stock + voucher reservation TTL)</p>
          <p>Redirecting to payment.pay_url…</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Payment window: <span className="font-medium text-foreground">5:00</span> remaining</span>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="w-3.5 h-3.5" /> Open payment page manually
        </Button>
      </>
    )}
    {state === "error" && (
      <>
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <p className="font-serif text-2xl font-semibold">Order Failed</p>
        <p className="text-sm text-muted-foreground">Unable to create your order. This could be due to stock changes or a system error.</p>
        <Button>Return to Checkout</Button>
      </>
    )}
    {state === "idempotent" && (
      <>
        <div className="w-14 h-14 rounded-full bg-info/10 flex items-center justify-center mx-auto">
          <CreditCard className="w-7 h-7 text-info" />
        </div>
        <p className="font-serif text-2xl font-semibold">Existing Pending Order</p>
        <p className="text-sm text-muted-foreground">You already have a pending order for this cart. Resuming payment…</p>
        <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
          <p>Idempotent response: same order returned, not duplicated</p>
        </div>
        <Button>Continue to Payment</Button>
      </>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 5: PAYMENT RESULT
   ═══════════════════════════════════════════════════ */
const PaymentResultScreen = ({ state = "success" }: { state?: "success" | "failed" | "unknown" }) => (
  <div className="bg-card border border-border rounded-lg p-12 max-w-lg mx-auto text-center space-y-4">
    {state === "success" && (
      <>
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <p className="font-serif text-2xl font-semibold">Payment Successful!</p>
        <p className="text-sm text-muted-foreground">Your order #ORD-38291 has been confirmed.</p>
        <div className="bg-secondary/50 rounded-md p-4 text-left text-xs space-y-1">
          <p><span className="text-muted-foreground">Order:</span> ORD-38291</p>
          <p><span className="text-muted-foreground">Amount:</span> $2,977.00</p>
          <p><span className="text-muted-foreground">Payment:</span> MoMo</p>
        </div>
        <Button className="w-full">View My Orders</Button>
        <Button variant="outline" className="w-full">Continue Shopping</Button>
      </>
    )}
    {state === "failed" && (
      <>
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="font-serif text-2xl font-semibold">Payment Failed</p>
        <p className="text-sm text-muted-foreground">Your payment could not be processed. Your cart items have been released.</p>
        <Button className="w-full">Try Again</Button>
        <Button variant="outline" className="w-full">Return to Cart</Button>
      </>
    )}
    {state === "unknown" && (
      <>
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <p className="font-serif text-2xl font-semibold">Payment Processing</p>
        <p className="text-sm text-muted-foreground">We're confirming your payment status. This may take a moment.</p>
        <div className="bg-secondary/50 rounded-md p-3 text-xs text-muted-foreground">
          <p>No order-status polling API available.</p>
          <p>Payment finalized via server-to-server IPN callback.</p>
          <p>Frontend cannot confirm final status directly.</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        <p className="text-xs text-muted-foreground">Check your email for order confirmation, or visit My Orders later.</p>
        <Button variant="outline" className="w-full">Go to My Orders</Button>
      </>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   SCREEN 6: PENDING PAYMENT / EXPIRED
   ═══════════════════════════════════════════════════ */
const PendingExpiredScreen = ({ state = "pending" }: { state?: "pending" | "expired" }) => (
  <div className="bg-card border border-border rounded-lg p-8 max-w-lg mx-auto text-center space-y-4">
    {state === "pending" && (
      <>
        <Clock className="w-10 h-10 text-warning mx-auto" />
        <p className="font-serif text-2xl font-semibold">Payment Pending</p>
        <p className="text-sm text-muted-foreground">You have an incomplete payment. Complete it before the reservation expires.</p>
        <div className="bg-warning/10 border border-warning/30 rounded-md p-4 text-center">
          <p className="text-xs text-muted-foreground">Time remaining</p>
          <p className="font-serif text-3xl font-bold text-warning-foreground">3:42</p>
          <p className="text-[10px] text-muted-foreground mt-1">expires_in from place-order response (300s TTL)</p>
        </div>
        <Button className="w-full"><ExternalLink className="w-4 h-4" /> Resume Payment</Button>
      </>
    )}
    {state === "expired" && (
      <>
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <p className="font-serif text-2xl font-semibold">Reservation Expired</p>
        <p className="text-sm text-muted-foreground">Your order reservation has timed out. Stock and vouchers have been released.</p>
        <p className="text-xs text-muted-foreground">The pending order was automatically cancelled by the backend.</p>
        <Button className="w-full">Return to Checkout</Button>
      </>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN COMMERCE SHOWCASE
   ═══════════════════════════════════════════════════ */
const CommerceShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Commerce UI Showcase</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Feature 2 — Add to Cart → Checkout → Payment</p>
          </div>
          <a href="/" className="text-sm text-accent hover:underline flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-16">

        {/* SCREEN INVENTORY */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Section 1: Screen Inventory</h2>
          <SpecTable
            headers={["#", "Screen", "Route", "Endpoint", "Method"]}
            rows={[
              ["1", "Add to Cart", "/products/[slug]", "POST /api/v1/cart/add", "POST"],
              ["2", "Cart Page", "/cart", "— (uses cached cart snapshot)", "—"],
              ["3", "Checkout Page", "/checkout", "GET /api/v1/checkout/preview", "GET (w/ body)"],
              ["4", "Payment Redirect", "/checkout/payment", "POST /api/v1/checkout/place-order", "POST"],
              ["5", "Payment Result", "/checkout/result", "— (reads URL params from MoMo redirect)", "—"],
              ["6", "Pending / Expired", "/checkout/pending", "— (timeout state)", "—"],
              ["7", "Cart Locked", "/cart", "— (state from place-order or checkout preview)", "—"],
            ]}
          />
        </section>

        {/* ADD TO CART */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 1: Add to Cart</h2>
          <p className="text-sm text-muted-foreground mb-4">POST /api/v1/cart/add {"{ variationId, quantity }"} — Response: cart snapshot</p>
          <Tabs defaultValue="default">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="loading">Loading</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="error">Error</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
            </TabsList>
            <div className="max-w-sm">
              <TabsContent value="default"><AddToCartScreen state="default" /></TabsContent>
              <TabsContent value="loading"><AddToCartScreen state="loading" /></TabsContent>
              <TabsContent value="success"><AddToCartScreen state="success" /></TabsContent>
              <TabsContent value="error"><AddToCartScreen state="error" /></TabsContent>
              <TabsContent value="out-of-stock"><AddToCartScreen state="out-of-stock" /></TabsContent>
            </div>
          </Tabs>
        </section>

        {/* CART */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 2: Cart Page</h2>
          <p className="text-sm text-muted-foreground mb-4">Displays cart snapshot from last /cart/add response. No dedicated cart-list API.</p>
          <Tabs defaultValue="default">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="empty">Empty</TabsTrigger>
              <TabsTrigger value="locked">Cart Locked</TabsTrigger>
            </TabsList>
            <TabsContent value="default"><CartPage state="default" /></TabsContent>
            <TabsContent value="empty"><CartPage state="empty" /></TabsContent>
            <TabsContent value="locked"><CartPage state="locked" /></TabsContent>
          </Tabs>
        </section>

        {/* CHECKOUT */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 3: Checkout Page</h2>
          <p className="text-sm text-muted-foreground mb-4">GET /api/v1/checkout/preview {"{ cart_id, shipping_fee?, system_discount_code?, shipping_discount_code? }"}</p>
          <Tabs defaultValue="default">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="loading">Loading</TabsTrigger>
              <TabsTrigger value="stock-error">Stock Issue</TabsTrigger>
              <TabsTrigger value="voucher-error">Invalid Voucher</TabsTrigger>
            </TabsList>
            <TabsContent value="default"><CheckoutPage state="default" /></TabsContent>
            <TabsContent value="loading"><CheckoutPage state="loading" /></TabsContent>
            <TabsContent value="stock-error"><CheckoutPage state="stock-error" /></TabsContent>
            <TabsContent value="voucher-error"><CheckoutPage state="voucher-error" /></TabsContent>
          </Tabs>
        </section>

        {/* PAYMENT REDIRECT */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 4: Payment Redirect</h2>
          <p className="text-sm text-muted-foreground mb-4">POST /api/v1/checkout/place-order → redirects to payment.pay_url</p>
          <Tabs defaultValue="redirecting">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="redirecting">Redirecting</TabsTrigger>
              <TabsTrigger value="error">Order Failed</TabsTrigger>
              <TabsTrigger value="idempotent">Idempotent (Existing Order)</TabsTrigger>
            </TabsList>
            <TabsContent value="redirecting"><PaymentRedirectScreen state="redirecting" /></TabsContent>
            <TabsContent value="error"><PaymentRedirectScreen state="error" /></TabsContent>
            <TabsContent value="idempotent"><PaymentRedirectScreen state="idempotent" /></TabsContent>
          </Tabs>
        </section>

        {/* PAYMENT RESULT */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 5: Payment Result</h2>
          <p className="text-sm text-muted-foreground mb-4">User returns from MoMo payment page. Final status via IPN only.</p>
          <Tabs defaultValue="success">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="unknown">Unknown / Processing</TabsTrigger>
            </TabsList>
            <TabsContent value="success"><PaymentResultScreen state="success" /></TabsContent>
            <TabsContent value="failed"><PaymentResultScreen state="failed" /></TabsContent>
            <TabsContent value="unknown"><PaymentResultScreen state="unknown" /></TabsContent>
          </Tabs>
        </section>

        {/* PENDING / EXPIRED */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-2">Screen 6 & 7: Pending & Expired Reservation</h2>
          <Tabs defaultValue="pending">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="pending">Pending Payment</TabsTrigger>
              <TabsTrigger value="expired">Reservation Expired</TabsTrigger>
            </TabsList>
            <TabsContent value="pending"><PendingExpiredScreen state="pending" /></TabsContent>
            <TabsContent value="expired"><PendingExpiredScreen state="expired" /></TabsContent>
          </Tabs>
        </section>

        {/* FLOW */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">End-to-End Flow</h2>
          <div className="bg-card border border-border rounded-lg p-6 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
{`Product Page → POST /api/v1/cart/add { variationId, quantity }
  ├─ 200 → Cart snapshot stored → Show success toast
  │   └─ Navigate to /cart
  │       └─ "Proceed to Checkout" →
  │           └─ GET /api/v1/checkout/preview { cart_id }
  │               ├─ 200 → Render checkout with items + totals + available_vouchers
  │               │   └─ Apply voucher? → Re-call preview with discount codes
  │               │   └─ "Place Order & Pay" →
  │               │       └─ POST /api/v1/checkout/place-order
  │               │           ├─ 200 (new order) → Redirect to payment.pay_url
  │               │           │   └─ MoMo payment page (external)
  │               │           │       └─ User returns to /checkout/result
  │               │           │           ├─ resultCode=0 → "Payment Successful"
  │               │           │           ├─ resultCode!=0 → "Payment Failed"
  │               │           │           └─ No resultCode → "Processing" (unknown)
  │               │           ├─ 200 (idempotent, existing pending order) → "Resume Payment"
  │               │           ├─ 409 (cart locked) → Cart locked state
  │               │           └─ 400 (stock/validation) → Show error
  │               └─ 400/409 → Error/locked state
  └─ 400/500 → Error toast

Timer: expires_in (300s) starts on place-order success
  ├─ If payment completes within TTL → IPN confirms
  └─ If TTL expires → Reservation cancelled → "Expired" screen`}
          </div>
        </section>

        {/* STATE MATRIX */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">State Matrix</h2>
          <SpecTable
            headers={["Screen", "Loading", "Success", "Error", "Empty", "Locked", "Expired"]}
            rows={[
              ["Add to Cart", "Spinner on button", "Toast + cart badge update", "Inline error", "—", "—", "—"],
              ["Cart", "Skeleton rows", "Items displayed", "Error toast", "Empty state illustration", "Lock banner + disabled items", "—"],
              ["Checkout", "Full page loader", "Totals + vouchers rendered", "Stock warning / voucher error", "Redirect to cart if empty", "Redirect to pending payment", "—"],
              ["Payment Redirect", "Redirect spinner", "→ MoMo page", "Order failed card", "—", "—", "—"],
              ["Payment Result", "—", "Confirmation card", "Failed card", "—", "—", "—"],
              ["Pending/Expired", "—", "—", "—", "—", "Timer countdown", "Expired banner + CTA"],
            ]}
          />
        </section>

        {/* COMPLIANCE */}
        <section>
          <h2 className="font-serif text-3xl font-semibold mb-4">Constraint Compliance</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            {[
              "Only uses /cart/add, /checkout/preview, /checkout/place-order — no invented endpoints",
              "cart/add payload: { variationId, quantity } only — exact match",
              "checkout/preview: reads cart_id, shipping_fee, discount codes — exact match",
              "place-order: same checkout payload — exact match",
              "IPN is server-to-server — frontend does NOT call /payment/momo/ipn",
              "No cart list/update/remove APIs used (acknowledged as limitation)",
              "Cart locked state handled for pending payment scenario",
              "Idempotent place-order response handled (existing pending order)",
              "expires_in / 300s TTL reservation visualized",
              "Unknown payment state handled (no order-status polling API)",
              "Desktop web only",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default CommerceShowcase;

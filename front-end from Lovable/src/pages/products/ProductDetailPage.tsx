import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Minus, Plus, ShoppingBag, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { catalogApi, type ProductDetailItem, type ProductDetailResponseData } from "@/lib/api/catalog.api";
import { cartApi } from "@/lib/api/cart.api";
import { checkoutApi, type OrderStatusData } from "@/lib/api/checkout.api";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { setCartSnapshot } from "@/lib/commerce/cart-session";
import { clearPendingOrderSession, getPendingOrderSession } from "@/lib/commerce/order-session";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isCustomer, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetailResponseData | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pendingOrder, setPendingOrder] = useState(() => getPendingOrderSession());
  const [orderStatus, setOrderStatus] = useState<OrderStatusData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isCartLocked = Boolean(
    pendingOrder &&
      (!orderStatus || !orderStatus.is_final),
  );

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      try {
        const response = await catalogApi.getProductDetail(slug);
        if (!isActive) return;
        const nextProduct = response.data;
        setProduct(nextProduct);

        setSelectedItemId(nextProduct.defaultSelection.productItemId);
        setSelectedVariationId(nextProduct.defaultSelection.variationId);
        setSelectedImageIndex(0);
        setQuantity(1);
      } catch (err) {
        if (!isActive) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load product details.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!pendingOrder?.orderId) return;

    let timerId: number | null = null;
    let isActive = true;

    const pollOrderStatus = async () => {
      if (!isActive) return;
      setCheckingStatus(true);
      try {
        const response = await checkoutApi.getOrderStatus(pendingOrder.orderId, accessToken);
        if (!isActive) return;
        const status = response.data;
        setOrderStatus(status);
        if (status.is_final) {
          clearPendingOrderSession();
          setPendingOrder(null);
        }
      } catch {
        // keep lock state until next successful check
      } finally {
        if (isActive) setCheckingStatus(false);
      }
    };

    pollOrderStatus();
    timerId = window.setInterval(pollOrderStatus, 3000);

    const onFocus = () => pollOrderStatus();
    window.addEventListener("focus", onFocus);

    return () => {
      isActive = false;
      if (timerId) window.clearInterval(timerId);
      window.removeEventListener("focus", onFocus);
    };
  }, [accessToken, pendingOrder?.orderId]);

  const selectedItem = useMemo<ProductDetailItem | null>(() => {
    if (!product) return null;
    return product.items.find((item) => item.productItemId === selectedItemId) || product.items[0] || null;
  }, [product, selectedItemId]);

  const selectedSize = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.sizes.find((size) => size.variationId === selectedVariationId) || null;
  }, [selectedItem, selectedVariationId]);
  const maxSelectableQty = Math.max(selectedSize?.qtyInStock || 1, 1);

  const activeImage = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.images[selectedImageIndex] || selectedItem.images[0] || null;
  }, [selectedImageIndex, selectedItem]);

  function onSelectItem(productItemId: number) {
    if (!product) return;
    const item = product.items.find((entry) => entry.productItemId === productItemId);
    if (!item) return;

    setSelectedItemId(item.productItemId);
    setSelectedImageIndex(0);

    const nextSize = item.sizes.find((size) => size.isAvailable) || item.sizes[0] || null;
    setSelectedVariationId(nextSize?.variationId || null);
    setQuantity(1);
  }

  async function onAddToCart() {
    if (isCartLocked) {
      toast.error("This cart is currently locked due to a pending payment.");
      return;
    }

    if (!selectedVariationId) {
      toast.error("Please choose a size before adding to cart.");
      return;
    }
    if (!selectedSize?.isAvailable) {
      toast.error("Selected size is out of stock.");
      return;
    }
    if (quantity > (selectedSize.qtyInStock || 0)) {
      toast.error(`Only ${selectedSize.qtyInStock} items left in stock.`);
      return;
    }

    setAdding(true);
    try {
      const response = await cartApi.addToCart(
        {
          variationId: selectedVariationId,
          quantity,
        },
        accessToken,
      );
      setCartSnapshot(response.data);
      toast.success(response.message || "Added to cart.");
      navigate("/cart");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "Failed to add to cart.");
      } else {
        toast.error("Failed to add to cart.");
      }
    } finally {
      setAdding(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/auth/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to products
        </Button>
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6">
          <p className="text-sm text-destructive">{error || "Product not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/products")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to products
          </Button>
          <div className="flex items-center gap-3">
            {isCartLocked ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Cart Locked
              </Badge>
            ) : null}
            <Link to="/cart" className="text-sm text-accent hover:underline">
              Cart
            </Link>
            <Link to="/" className="text-sm text-accent hover:underline">
              Home
            </Link>
            {isAuthenticated && isCustomer ? (
              <Button variant="outline" size="sm" onClick={() => void onLogout()} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Log out"}
              </Button>
            ) : null}
          </div>
        </div>

        {isCartLocked ? (
          <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm font-medium">
              Cart is blocked while payment is in progress (Order #{pendingOrder?.orderId}).
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete or fail the payment first, then you can add items again.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingOrder?.payUrl ? (
                <Button
                  size="sm"
                  onClick={() => window.open(pendingOrder.payUrl!, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Resume Payment
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => navigate("/cart")} disabled={checkingStatus}>
                {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Go to Cart
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[3/4] bg-secondary">
                {activeImage?.imageUrl ? (
                  <img
                    src={activeImage.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>
            {selectedItem?.images?.length ? (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {selectedItem.images.map((image, index) => (
                  <button
                    key={image.id}
                    className={`overflow-hidden rounded-md border ${
                      index === selectedImageIndex ? "border-foreground" : "border-border"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <div className="aspect-square bg-secondary">
                      <img src={image.imageUrl} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent">
                {product.category?.name || "Catalog"}
              </p>
              <h1 className="mt-1 font-serif text-4xl font-semibold">{product.name}</h1>
              <p className="mt-2 text-2xl font-semibold">
                {selectedItem ? formatPrice(selectedItem.price) : formatPrice(product.priceRange.min)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Rating {product.ratingsAverage.toFixed(1)} ({product.ratingsCount})
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {product.items.map((item) => {
                  const isSelected = item.productItemId === selectedItem?.productItemId;
                  return (
                    <button
                      key={item.productItemId}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        isSelected ? "border-foreground bg-foreground text-background" : "border-border"
                      }`}
                      onClick={() => onSelectItem(item.productItemId)}
                    >
                      {item.colour?.name || `Color ${item.productItemId}`}
                      {!item.hasStock ? " (Out)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {(selectedItem?.sizes || []).map((size) => {
                  const isSelected = size.variationId === selectedVariationId;
                  return (
                    <button
                      key={size.variationId}
                      disabled={!size.isAvailable}
                      className={`min-w-14 rounded-md border px-3 py-2 text-sm ${
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background"
                      } ${!size.isAvailable ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                      onClick={() => setSelectedVariationId(size.variationId)}
                    >
                      {size.sizeName || "N/A"}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSize
                  ? `Stock: ${selectedSize.qtyInStock}`
                  : "Please choose a size."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quantity
              </p>
              <div className="inline-flex items-center rounded-md border border-border">
                <button
                  className="px-3 py-2"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={adding}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button
                  className="px-3 py-2"
                  onClick={() => setQuantity((prev) => Math.min(maxSelectableQty, prev + 1))}
                  disabled={adding || quantity >= maxSelectableQty}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={onAddToCart}
              disabled={isCartLocked || adding || !selectedVariationId || !selectedSize?.isAvailable}
            >
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
              {isCartLocked ? "Cart Locked for Payment" : adding ? "Adding..." : "Add to Cart"}
            </Button>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
              {product.description ? (
                <p className="text-muted-foreground">{product.description}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {product.material ? <Badge variant="secondary">Material: {product.material}</Badge> : null}
                {product.hasStock ? (
                  <Badge variant="secondary">In stock ({product.totalStock})</Badge>
                ) : (
                  <Badge variant="secondary">Out of stock</Badge>
                )}
              </div>

              {product.careInstructions ? (
                <p className="text-xs text-muted-foreground">
                  Care: {product.careInstructions}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

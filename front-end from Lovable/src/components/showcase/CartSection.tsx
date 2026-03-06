import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Minus, Plus, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const CartItemRow = ({ name, variant, price, qty, image }: {
  name: string; variant: string; price: string; qty: number; image: string;
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-border">
    <div className="w-20 h-24 bg-secondary rounded-md flex items-center justify-center text-xs text-muted-foreground">{image}</div>
    <div className="flex-1 space-y-1">
      <p className="font-serif text-base font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{variant}</p>
      <div className="inline-flex items-center border border-border rounded-md mt-1">
        <button className="p-1.5 hover:bg-secondary"><Minus className="w-3 h-3" /></button>
        <span className="w-8 text-center text-xs font-medium">{qty}</span>
        <button className="p-1.5 hover:bg-secondary"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
    <div className="text-right space-y-1">
      <p className="font-medium">{price}</p>
      <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>
    </div>
  </div>
);

const CartSection = () => {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">7. Cart Components</h2>
      <p className="showcase-section-desc">Cart item rows, coupon input, totals panel, cart summary.</p>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-0">
          <h3 className="showcase-group-title">Cart Items</h3>
          <CartItemRow name="Silk Evening Dress" variant="Black / Size M" price="$1,280.00" qty={1} image="[img]" />
          <CartItemRow name="Cashmere Blazer" variant="Ivory / Size S" price="$890.00" qty={2} image="[img]" />
          <CartItemRow name="Leather Clutch" variant="Burgundy" price="$420.00" qty={1} image="[img]" />

          <div className="pt-4">
            <h3 className="showcase-group-title">Coupon Input</h3>
            <div className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Promo code" />
              </div>
              <Button variant="outline">Apply</Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">WELCOME20 <button className="hover:text-destructive"><X className="w-3 h-3" /></button></span>
              <span className="text-xs text-success">−$518.00 applied</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="showcase-group-title">Cart Summary</h3>
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
            <h4 className="font-serif text-xl font-semibold">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>$3,480.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>Free</span></div>
              <div className="flex justify-between text-success"><span>Discount (WELCOME20)</span><span>−$518.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>$237.00</span></div>
            </div>
            <Separator />
            <div className="flex justify-between items-baseline">
              <span className="font-serif text-lg font-semibold">Total</span>
              <span className="font-serif text-2xl font-bold">$3,199.00</span>
            </div>
            <Button className="w-full">Proceed to Checkout</Button>
            <p className="text-[10px] text-center text-muted-foreground">Free returns within 30 days</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSection;

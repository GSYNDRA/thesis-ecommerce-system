import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Truck, Zap, MapPin, Edit2 } from "lucide-react";

const AddressCard = ({ label, name, address, active }: { label: string; name: string; address: string; active?: boolean }) => (
  <div className={`border rounded-lg p-4 cursor-pointer transition-all ${active ? "border-foreground shadow-sm" : "border-border hover:border-muted-foreground"}`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
          {active && <Check className="w-4 h-4 text-success" />}
        </div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{address}</p>
      </div>
      <button className="text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
    </div>
  </div>
);

const ShippingMethodRow = ({ name, eta, price, icon: Icon, selected }: { name: string; eta: string; price: string; icon: React.ElementType; selected?: boolean }) => (
  <div className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-all ${selected ? "border-foreground shadow-sm" : "border-border hover:border-muted-foreground"}`}>
    <Icon className="w-5 h-5 text-muted-foreground" />
    <div className="flex-1">
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{eta}</p>
    </div>
    <span className="text-sm font-medium">{price}</span>
    {selected && <Check className="w-4 h-4 text-success" />}
  </div>
);

const CheckoutSection = () => (
  <section className="showcase-section">
    <h2 className="showcase-section-title">8. Checkout Components</h2>
    <p className="showcase-section-desc">Address cards, shipping methods, payment methods, order summary.</p>

    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="showcase-group-title">Address Cards</h3>
          <div className="space-y-3">
            <AddressCard label="Home" name="Jane Doe" address="123 Fashion Ave, Suite 5, New York, NY 10001" active />
            <AddressCard label="Office" name="Jane Doe" address="456 Commerce Blvd, Floor 12, New York, NY 10012" />
          </div>
        </div>

        <div>
          <h3 className="showcase-group-title">Shipping Methods</h3>
          <div className="space-y-3">
            <ShippingMethodRow name="Standard Shipping" eta="5–7 business days" price="Free" icon={Truck} />
            <ShippingMethodRow name="Express Shipping" eta="2–3 business days" price="$15.00" icon={Zap} selected />
          </div>
        </div>

        <div>
          <h3 className="showcase-group-title">Payment Methods</h3>
          <RadioGroup defaultValue="card" className="space-y-3">
            <label className="flex items-center gap-4 border border-foreground rounded-lg p-4 cursor-pointer shadow-sm">
              <RadioGroupItem value="card" />
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Credit Card</p>
                <p className="text-xs text-muted-foreground">Visa ending in 4242</p>
              </div>
              <Badge variant="outline" className="text-[10px]">DEFAULT</Badge>
            </label>
            <label className="flex items-center gap-4 border border-border rounded-lg p-4 cursor-pointer hover:border-muted-foreground transition-colors">
              <RadioGroupItem value="paypal" />
              <span className="text-sm font-semibold text-info">P</span>
              <div className="flex-1">
                <p className="text-sm font-medium">PayPal</p>
                <p className="text-xs text-muted-foreground">jane@example.com</p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </div>

      <div>
        <h3 className="showcase-group-title">Order Summary (Checkout)</h3>
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
          <h4 className="font-serif text-xl font-semibold">Your Order</h4>
          {[
            { name: "Silk Evening Dress", variant: "Black / M", price: "$1,280.00" },
            { name: "Cashmere Blazer ×2", variant: "Ivory / S", price: "$1,780.00" },
            { name: "Leather Clutch", variant: "Burgundy", price: "$420.00" },
          ].map((item) => (
            <div key={item.name} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.variant}</p>
              </div>
              <span>{item.price}</span>
            </div>
          ))}
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>$3,480.00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping (Express)</span><span>$15.00</span></div>
            <div className="flex justify-between text-success"><span>Discount</span><span>−$518.00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>$237.00</span></div>
          </div>
          <Separator />
          <div className="flex justify-between items-baseline">
            <span className="font-serif text-lg font-semibold">Total</span>
            <span className="font-serif text-2xl font-bold">$3,214.00</span>
          </div>
          <Button className="w-full">Place Order</Button>
        </div>
      </div>
    </div>
  </section>
);

export default CheckoutSection;

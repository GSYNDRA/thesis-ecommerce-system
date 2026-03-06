import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Star, Minus, Plus } from "lucide-react";
import { useState } from "react";

const ProductCard = ({ name, price, originalPrice, image, badge, soldOut }: {
  name: string; price: string; originalPrice?: string; image: string; badge?: string; soldOut?: boolean;
}) => (
  <div className={`group relative bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${soldOut ? "opacity-60" : ""}`}>
    <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-serif text-lg">{image}</div>
      {badge && <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs">{badge}</Badge>}
      {soldOut && <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center"><span className="bg-card px-4 py-1 text-sm font-medium rounded">SOLD OUT</span></div>}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full"><Heart className="w-4 h-4" /></Button>
      </div>
      {!soldOut && (
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-3">
          <Button className="w-full" size="sm"><ShoppingBag className="w-4 h-4 mr-2" /> Quick Add</Button>
        </div>
      )}
    </div>
    <div className="p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Maison Collection</p>
      <p className="font-serif text-lg font-medium">{name}</p>
      <div className="flex items-center gap-2">
        <span className="font-medium">{price}</span>
        {originalPrice && <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>}
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= 4 ? "fill-warning text-warning" : "text-border"}`} />)}
        <span className="text-xs text-muted-foreground ml-1">(42)</span>
      </div>
    </div>
  </div>
);

const SizeSelector = () => {
  const [selected, setSelected] = useState("M");
  const sizes = [
    { label: "XS", available: true },
    { label: "S", available: true },
    { label: "M", available: true },
    { label: "L", available: true },
    { label: "XL", available: false },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Size</p>
      <div className="flex gap-2">
        {sizes.map((s) => (
          <button
            key={s.label}
            disabled={!s.available}
            onClick={() => s.available && setSelected(s.label)}
            className={`w-12 h-12 rounded-md border text-sm font-medium transition-all
              ${selected === s.label ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}
              ${!s.available ? "opacity-30 cursor-not-allowed line-through" : "cursor-pointer"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ColorSelector = () => {
  const [selected, setSelected] = useState(0);
  const colors = [
    { name: "Noir", hsl: "220 12% 20%" },
    { name: "Ivory", hsl: "40 33% 90%" },
    { name: "Burgundy", hsl: "350 50% 30%" },
    { name: "Navy", hsl: "220 50% 25%" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Color — {colors[selected].name}</p>
      <div className="flex gap-3">
        {colors.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setSelected(i)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${selected === i ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
            style={{ backgroundColor: `hsl(${c.hsl})` }}
          />
        ))}
      </div>
    </div>
  );
};

const QuantitySelector = () => {
  const [qty, setQty] = useState(1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quantity</p>
      <div className="inline-flex items-center border border-border rounded-md">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-secondary transition-colors"><Minus className="w-4 h-4" /></button>
        <span className="w-12 text-center text-sm font-medium">{qty}</span>
        <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-secondary transition-colors"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

const ProductSection = () => {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">6. Product Components</h2>
      <p className="showcase-section-desc">Product cards, price blocks, size/color/quantity selectors.</p>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Product Cards</h3>
        <div className="grid grid-cols-4 gap-6">
          <ProductCard name="Silk Evening Dress" price="$1,280" image="[Product Image]" />
          <ProductCard name="Cashmere Blazer" price="$890" originalPrice="$1,120" image="[Product Image]" badge="SALE" />
          <ProductCard name="Leather Clutch" price="$420" image="[Product Image]" badge="NEW" />
          <ProductCard name="Wool Coat" price="$1,650" image="[Product Image]" soldOut />
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Price Block</h3>
        <div className="showcase-row">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Regular</p>
            <p className="font-serif text-2xl font-semibold">$1,280.00</p>
          </div>
          <div className="w-px h-12 bg-border mx-4" />
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">On Sale</p>
            <div className="flex items-baseline gap-2">
              <p className="font-serif text-2xl font-semibold text-destructive">$890.00</p>
              <p className="text-base text-muted-foreground line-through">$1,120.00</p>
              <Badge className="bg-destructive text-destructive-foreground text-xs">-21%</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Selectors</h3>
        <div className="flex gap-12">
          <SizeSelector />
          <ColorSelector />
          <QuantitySelector />
        </div>
      </div>
    </section>
  );
};

export default ProductSection;

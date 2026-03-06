import { Button } from "@/components/ui/button";
import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { useState } from "react";

const ModalDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Open Modal</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-2xl font-semibold mb-2">Size Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">Find your perfect fit with our measurement guide.</p>
            <div className="bg-secondary rounded-md p-4 text-sm mb-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <span className="font-medium">Size</span><span className="font-medium">Bust</span><span className="font-medium">Waist</span><span className="font-medium">Hips</span>
                <span>S</span><span>34"</span><span>26"</span><span>36"</span>
                <span>M</span><span>36"</span><span>28"</span><span>38"</span>
                <span>L</span><span>38"</span><span>30"</span><span>40"</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => setOpen(false)}>Got It</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>Delete Item</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Remove from cart?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => setOpen(false)}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DrawerDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Open Drawer</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-background border-l border-border shadow-xl w-full max-w-md h-full p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-semibold">Filters</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              {["Category", "Color", "Size", "Price Range", "Brand"].map((filter) => (
                <div key={filter} className="border-b border-border pb-4">
                  <button className="w-full flex items-center justify-between text-sm font-medium">
                    {filter}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Clear All</Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OverlaySection = () => (
  <section className="showcase-section">
    <h2 className="showcase-section-title">12. Overlay Components</h2>
    <p className="showcase-section-desc">Modal, confirmation dialog, drawer/panel. Click buttons to preview.</p>

    <div className="showcase-row">
      <ModalDemo />
      <ConfirmDialog />
      <DrawerDemo />
    </div>
  </section>
);

export default OverlaySection;

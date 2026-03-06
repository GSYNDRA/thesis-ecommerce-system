import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, Circle, Package, Truck, CreditCard, Clock } from "lucide-react";

const DataDisplaySection = () => {
  const orders = [
    { id: "#38291", customer: "Jane Doe", items: 3, total: "$3,199.00", status: "Shipped", date: "Mar 4, 2026" },
    { id: "#38290", customer: "Mike Smith", items: 1, total: "$890.00", status: "Processing", date: "Mar 3, 2026" },
    { id: "#38289", customer: "Sarah Lee", items: 2, total: "$1,700.00", status: "Delivered", date: "Mar 2, 2026" },
    { id: "#38288", customer: "Tom Brown", items: 1, total: "$420.00", status: "Cancelled", date: "Mar 1, 2026" },
  ];

  const statusStyles: Record<string, string> = {
    Shipped: "bg-info text-info-foreground",
    Processing: "bg-warning text-warning-foreground",
    Delivered: "bg-success text-success-foreground",
    Cancelled: "bg-destructive text-destructive-foreground",
  };

  const steps = [
    { label: "Order Placed", icon: CreditCard, done: true },
    { label: "Processing", icon: Package, done: true },
    { label: "Shipped", icon: Truck, done: true, active: true },
    { label: "Delivered", icon: Check, done: false },
  ];

  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">13. Data Display Components</h2>
      <p className="showcase-section-desc">Table, pagination, badge set, timeline/status stepper.</p>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Data Table</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3 font-medium">{o.total}</td>
                  <td className="px-4 py-3"><Badge className={`text-[10px] ${statusStyles[o.status]}`}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Pagination</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled><ChevronLeft className="w-4 h-4" /></Button>
          {[1, 2, 3, "...", 12].map((p, i) => (
            <Button key={i} variant={p === 1 ? "default" : "ghost"} size="icon" className="w-9 h-9 text-sm">
              {p}
            </Button>
          ))}
          <Button variant="ghost" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          <span className="ml-4 text-xs text-muted-foreground">Showing 1–10 of 120 results</span>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Badge Set</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-success text-success-foreground">Success</Badge>
          <Badge className="bg-warning text-warning-foreground">Warning</Badge>
          <Badge className="bg-info text-info-foreground">Info</Badge>
          <Badge className="bg-accent text-accent-foreground">Accent</Badge>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Order Status Stepper</h3>
        <div className="flex items-center max-w-2xl">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                } ${step.active ? "ring-2 ring-accent ring-offset-2" : ""}`}>
                  {step.done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-1.5rem] ${step.done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DataDisplaySection;

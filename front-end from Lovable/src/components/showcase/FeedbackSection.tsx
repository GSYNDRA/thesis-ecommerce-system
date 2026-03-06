import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Loader2, ShoppingBag, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ToastDemo = ({ type, title, desc }: { type: "success" | "error" | "info" | "warning"; title: string; desc: string }) => {
  const styles = {
    success: { border: "border-success", icon: <CheckCircle className="w-5 h-5 text-success" /> },
    error: { border: "border-destructive", icon: <AlertCircle className="w-5 h-5 text-destructive" /> },
    info: { border: "border-info", icon: <Info className="w-5 h-5 text-info" /> },
    warning: { border: "border-warning", icon: <AlertTriangle className="w-5 h-5 text-warning" /> },
  };
  const s = styles[type];
  return (
    <div className={`bg-card border ${s.border} rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-sm`}>
      {s.icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </div>
  );
};

const InlineError = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 text-destructive text-sm">
    <AlertCircle className="w-4 h-4" />
    <span>{message}</span>
  </div>
);

const AlertBanner = ({ type, message }: { type: "info" | "warning" | "error" | "success"; message: string }) => {
  const styles = {
    info: "bg-info/10 border-info/30 text-info",
    warning: "bg-warning/10 border-warning/30 text-warning-foreground",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    success: "bg-success/10 border-success/30 text-success",
  };
  const icons = {
    info: <Info className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
  };
  return (
    <div className={`border rounded-lg px-4 py-3 flex items-center gap-3 text-sm ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <p className="font-serif text-xl font-semibold mb-1">{title}</p>
    <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
    <Button variant="outline" className="mt-4">Browse Collection</Button>
  </div>
);

const SkeletonBlock = () => (
  <div className="space-y-3">
    <div className="h-40 rounded-lg skeleton-shimmer" />
    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
    <div className="h-3 w-1/2 rounded skeleton-shimmer" />
    <div className="h-4 w-1/3 rounded skeleton-shimmer" />
  </div>
);

const Spinner = () => (
  <div className="flex items-center gap-3">
    <Loader2 className="w-6 h-6 animate-spin text-accent" />
    <span className="text-sm text-muted-foreground">Loading...</span>
  </div>
);

const FeedbackSection = () => (
  <section className="showcase-section">
    <h2 className="showcase-section-title">11. Feedback Components</h2>
    <p className="showcase-section-desc">Toasts, inline errors, alert banners, empty states, skeletons, spinners.</p>

    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="showcase-group-title">Toast Notifications</h3>
          <div className="space-y-3">
            <ToastDemo type="success" title="Order Confirmed" desc="Your order #38291 has been placed successfully." />
            <ToastDemo type="error" title="Payment Failed" desc="Your card was declined. Please try another method." />
            <ToastDemo type="info" title="New Collection" desc="Spring 2026 collection is now available." />
            <ToastDemo type="warning" title="Low Stock" desc="Only 2 items left in your size." />
          </div>
        </div>

        <div>
          <h3 className="showcase-group-title">Inline Errors</h3>
          <div className="space-y-2">
            <InlineError message="Email address is required." />
            <InlineError message="Password must be at least 8 characters." />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="showcase-group-title">Alert Banners</h3>
          <div className="space-y-3">
            <AlertBanner type="info" message="Free shipping on orders over $500." />
            <AlertBanner type="warning" message="Your session will expire in 5 minutes." />
            <AlertBanner type="error" message="Unable to connect. Please check your internet." />
            <AlertBanner type="success" message="Your return has been processed successfully." />
          </div>
        </div>

        <div>
          <h3 className="showcase-group-title">Spinner</h3>
          <Spinner />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-8 mt-8">
      <div>
        <h3 className="showcase-group-title">Empty State</h3>
        <div className="bg-card border border-border rounded-lg">
          <EmptyState icon={ShoppingBag} title="Your Cart is Empty" desc="Looks like you haven't added anything yet. Explore our latest collection." />
        </div>
      </div>
      <div className="col-span-2">
        <h3 className="showcase-group-title">Skeleton Loaders</h3>
        <div className="grid grid-cols-3 gap-4">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    </div>
  </section>
);

export default FeedbackSection;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, ShoppingBag, MessageCircle, Palette, Shirt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const sections = [
  {
    title: "UI Master Components",
    desc: "Design system playground — typography, colors, buttons, inputs, navigation, product, cart, checkout, chat, staff, feedback, overlays, data display.",
    href: "/",
    icon: Palette,
    badge: "13 sections",
    anchor: true,
  },
  {
    title: "Live Product Catalog",
    desc: "Browse real products from backend catalog APIs, open detail page, choose color and size, then add to cart with variationId.",
    href: "/products",
    icon: Shirt,
    badge: "Live API",
  },
  {
    title: "Auth UI Showcase",
    desc: "9 auth screens with full state coverage: login, register, verify email, forgot password, OTP, reset password, session expired, logout.",
    href: "/auth-showcase",
    icon: Lock,
    badge: "9 screens",
  },
  {
    title: "Commerce UI Showcase",
    desc: "Add to Cart → Checkout → Payment flow. Cart locked, pending payment, expired reservation, idempotent orders, unknown payment status.",
    href: "/commerce-showcase",
    icon: ShoppingBag,
    badge: "7 screens",
  },
  {
    title: "Chat UI Showcase",
    desc: "AI chatbot + human handoff + staff dashboard. WebSocket event matrix, streaming tokens, reassignment, availability toggles.",
    href: "/chat-showcase",
    icon: MessageCircle,
    badge: "10 screens",
  },
];

const Index = () => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Fashion Ecommerce</p>
              <h1 className="font-serif text-5xl font-semibold tracking-tight">Design System Hub</h1>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
                Complete UI component showcase and screen specifications for authentication, commerce, and chat features. Desktop web only.
              </p>
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <p className="text-xs text-muted-foreground">{user?.email || "Signed in"}</p>
              <Button variant="outline" size="sm" onClick={onLogout} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-2 gap-6">
          {sections.map((s) => (
            <Link
              key={s.title}
              to={s.anchor ? "#" : s.href}
              className="group bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-lg transition-all hover:border-accent/30"
              onClick={s.anchor ? (e) => {
                e.preventDefault();
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              } : undefined}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-medium bg-secondary px-2 py-1 rounded-full text-muted-foreground">{s.badge}</span>
              </div>
              <h2 className="font-serif text-xl font-semibold mb-2 group-hover:text-accent transition-colors">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm text-accent font-medium">
                View Showcase <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-8 text-center text-xs text-muted-foreground">
          <p>MAISON — Fashion Ecommerce Design System · Desktop Web Only</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

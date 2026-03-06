import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Home, Menu, Search, ShoppingBag, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NavigationSection = () => {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">5. Navigation Components</h2>
      <p className="showcase-section-desc">Top nav, sidebar items, breadcrumbs, and tab patterns.</p>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Top Navigation Bar</h3>
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-8">
              <span className="font-serif text-2xl font-semibold tracking-tight">MAISON</span>
              <nav className="flex gap-6">
                {["New In", "Women", "Men", "Accessories", "Sale"].map((item) => (
                  <button key={item} className="text-sm font-medium text-foreground hover:text-accent transition-colors relative group">
                    {item}
                    {item === "Sale" && <Badge className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">HOT</Badge>}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 w-48 h-9 text-sm" placeholder="Search..." />
              </div>
              <Button variant="ghost" size="icon"><User className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><Heart className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">3</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Breadcrumb</h3>
        <div className="flex items-center gap-2 text-sm">
          <button className="text-muted-foreground hover:text-foreground flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <button className="text-muted-foreground hover:text-foreground">Women</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <button className="text-muted-foreground hover:text-foreground">Dresses</button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-medium">Evening Gowns</span>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Sidebar Navigation Items</h3>
        <div className="w-64 bg-card border border-border rounded-lg p-3 space-y-1">
          {[
            { label: "Dashboard", icon: Home, active: true },
            { label: "Orders", icon: ShoppingBag, badge: "12" },
            { label: "Products", icon: Menu },
            { label: "Customers", icon: User },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                item.active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  item.active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent text-accent-foreground"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Tabs</h3>
        <Tabs defaultValue="details" className="w-full max-w-lg">
          <TabsList className="bg-secondary">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sizing">Sizing</TabsTrigger>
            <TabsTrigger value="reviews">Reviews (42)</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
};

export default NavigationSection;

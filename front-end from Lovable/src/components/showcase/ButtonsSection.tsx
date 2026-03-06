import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ButtonsSection = () => {
  const variants = [
    { name: "Primary", variant: "default" as const },
    { name: "Secondary", variant: "secondary" as const },
    { name: "Ghost", variant: "ghost" as const },
    { name: "Outline", variant: "outline" as const },
    { name: "Destructive", variant: "destructive" as const },
    { name: "Link", variant: "link" as const },
  ];

  const sizes = [
    { name: "Small", size: "sm" as const },
    { name: "Default", size: "default" as const },
    { name: "Large", size: "lg" as const },
    { name: "Icon", size: "icon" as const },
  ];

  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">2. Buttons</h2>
      <p className="showcase-section-desc">All button variants with state coverage: default, hover (native), disabled, loading.</p>

      {variants.map((v) => (
        <div key={v.name} className="showcase-group">
          <h3 className="showcase-group-title">{v.name}</h3>
          <div className="showcase-row">
            <Button variant={v.variant}>Default</Button>
            <Button variant={v.variant} disabled>Disabled</Button>
            <Button variant={v.variant}>
              <Loader2 className="animate-spin" />
              Loading
            </Button>
            {sizes.map((s) => (
              <Button key={s.name} variant={v.variant} size={s.size}>
                {s.size === "icon" ? "✦" : s.name}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div className="showcase-group">
        <h3 className="showcase-group-title">Focus Ring Demo</h3>
        <p className="text-xs text-muted-foreground mb-3">Tab to these buttons to see focus ring styling.</p>
        <div className="showcase-row">
          <Button>Focus me (Tab)</Button>
          <Button variant="outline">Outline Focus</Button>
          <Button variant="ghost">Ghost Focus</Button>
        </div>
      </div>
    </section>
  );
};

export default ButtonsSection;

const TypographySection = () => {
  const colors = [
    { name: "Background", var: "--background", class: "bg-background" },
    { name: "Foreground", var: "--foreground", class: "bg-foreground" },
    { name: "Primary", var: "--primary", class: "bg-primary" },
    { name: "Secondary", var: "--secondary", class: "bg-secondary" },
    { name: "Muted", var: "--muted", class: "bg-muted" },
    { name: "Accent", var: "--accent", class: "bg-accent" },
    { name: "Destructive", var: "--destructive", class: "bg-destructive" },
    { name: "Success", var: "--success", class: "bg-success" },
    { name: "Warning", var: "--warning", class: "bg-warning" },
    { name: "Info", var: "--info", class: "bg-info" },
    { name: "Border", var: "--border", class: "bg-border" },
    { name: "Ring", var: "--ring", class: "bg-ring" },
  ];

  return (
    <section className="showcase-section">
      <h2 className="showcase-section-title">1. Typography & Color Tokens</h2>
      <p className="showcase-section-desc">Design foundations: type scale, font pairings, and semantic color palette.</p>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Serif — Cormorant Garamond</h3>
        <div className="space-y-3">
          <p className="font-serif text-5xl font-light tracking-tight">Display Light — 48px</p>
          <p className="font-serif text-4xl font-normal">Heading 1 — 36px</p>
          <p className="font-serif text-3xl font-medium">Heading 2 — 30px</p>
          <p className="font-serif text-2xl font-semibold">Heading 3 — 24px</p>
          <p className="font-serif text-xl font-bold">Heading 4 — 20px</p>
          <p className="font-serif text-lg italic">Body Italic — 18px</p>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Sans — Inter</h3>
        <div className="space-y-3">
          <p className="font-sans text-lg font-light">Body Light — 18px</p>
          <p className="font-sans text-base font-normal">Body Regular — 16px</p>
          <p className="font-sans text-base font-medium">Body Medium — 16px</p>
          <p className="font-sans text-sm font-normal">Small — 14px</p>
          <p className="font-sans text-xs font-medium uppercase tracking-widest">Caption / Overline — 12px</p>
          <p className="font-sans text-xs text-muted-foreground">Muted Helper Text — 12px</p>
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Color Palette</h3>
        <div className="grid grid-cols-6 gap-4">
          {colors.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-lg border border-border shadow-sm ${c.class}`} />
              <span className="text-xs font-medium">{c.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{c.var}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Spacing Scale</h3>
        <div className="flex items-end gap-2">
          {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="bg-accent rounded-sm" style={{ width: `${s * 4}px`, height: `${s * 4}px` }} />
              <span className="text-[10px] text-muted-foreground">{s * 4}px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="showcase-group">
        <h3 className="showcase-group-title">Border Radius & Shadows</h3>
        <div className="flex gap-6 items-center">
          {[
            { label: "sm", cls: "rounded-sm" },
            { label: "md", cls: "rounded-md" },
            { label: "lg", cls: "rounded-lg" },
            { label: "full", cls: "rounded-full" },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 bg-card border border-border shadow-md ${r.cls}`} />
              <span className="text-xs text-muted-foreground">{r.label}</span>
            </div>
          ))}
          <div className="w-px h-16 bg-border mx-4" />
          {[
            { label: "shadow-sm", cls: "shadow-sm" },
            { label: "shadow-md", cls: "shadow-md" },
            { label: "shadow-lg", cls: "shadow-lg" },
            { label: "shadow-xl", cls: "shadow-xl" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 bg-card rounded-lg ${s.cls}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TypographySection;

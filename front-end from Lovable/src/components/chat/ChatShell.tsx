import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  title: string;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  threadClassName?: string;
}

export function ChatShell({
  title,
  subtitle,
  headerRight,
  sidebar,
  children,
  className,
  contentClassName,
  threadClassName,
}: ChatShellProps) {
  return (
    <Card className={cn("min-h-[78vh] overflow-hidden border-border shadow-sm", className)}>
      <CardHeader className="border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-2xl font-semibold tracking-tight">{title}</CardTitle>
            {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
          </div>
          {headerRight ? <div className="flex items-center gap-2 self-start">{headerRight}</div> : null}
        </div>
      </CardHeader>

      <CardContent className={cn("grid min-h-[66vh] grid-cols-1 gap-4 pt-6 lg:grid-cols-[1fr_320px]", contentClassName)}>
        <div className={cn("flex min-h-0 flex-col rounded-lg border border-border bg-card", threadClassName)}>{children}</div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">{sidebar}</div>
      </CardContent>
    </Card>
  );
}

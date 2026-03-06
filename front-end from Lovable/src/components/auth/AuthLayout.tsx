import type { ReactNode } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWClassName?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  maxWClassName = "max-w-md",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center rounded-lg border border-border bg-secondary/30 p-8">
        <div className={cn("w-full rounded-lg border border-border bg-card p-8 shadow-lg", maxWClassName)}>
          <div className="mb-6 text-center">
            <p className="font-serif text-3xl font-semibold tracking-tight">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

import { cn } from "@/lib/utils";

type StatusTone = "info" | "success" | "warning" | "error";

interface StatusBannerProps {
  text: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

export function StatusBanner({ text, tone = "info", className }: StatusBannerProps) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm", TONE_CLASS[tone], className)}>
      {text}
    </div>
  );
}


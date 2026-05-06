import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number; // percent change, e.g. 12.4 or -3.1
  sub?: string;
}

/** Numeric KPI card used on dashboard/payments pages. */
export function KpiCard({ label, value, icon: Icon, delta, sub }: KpiCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = hasDelta && delta! >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

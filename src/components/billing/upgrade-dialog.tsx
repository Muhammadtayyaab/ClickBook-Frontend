import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PLAN_PRICES,
  createCheckoutSession,
  formatAmount,
  getPlanAmount,
  type BillingPeriod,
  type Plan,
} from "@/lib/payments-api";
import { listProjects, type ProjectCard } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog skips the site picker and pays for this site. */
  presetSiteId?: string;
  presetSiteName?: string;
  defaultPlan?: Plan;
}

const PLAN_ORDER: Plan[] = ["starter", "pro", "business"];

export function UpgradeDialog({ open, onClose, presetSiteId, presetSiteName, defaultPlan = "pro" }: Props) {
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [siteId, setSiteId] = useState<string | null>(presetSiteId ?? null);
  const [sites, setSites] = useState<ProjectCard[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlan(defaultPlan);
    setPeriod("monthly");
    setSiteId(presetSiteId ?? null);
    if (presetSiteId) return;
    listProjects({ status: "all" })
      .then((r) => {
        setSites(r.data);
        if (!siteId && r.data[0]) setSiteId(r.data[0].id);
      })
      .catch(() => toast.error("Failed to load your sites"));
  }, [open, presetSiteId, defaultPlan]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearlyDiscount = useMemo(() => {
    const m = getPlanAmount(plan, "monthly") * 12;
    const y = getPlanAmount(plan, "yearly");
    return Math.round((1 - y / m) * 100);
  }, [plan]);

  async function handleCheckout() {
    if (!siteId) {
      toast.error("Pick a site to publish");
      return;
    }
    setSubmitting(true);
    try {
      const { checkout_url } = await createCheckoutSession({
        site_id: siteId,
        plan,
        billing_period: period,
      });
      window.location.assign(checkout_url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start checkout");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Choose a plan
          </DialogTitle>
          <DialogDescription>
            {presetSiteName
              ? `Publish "${presetSiteName}" by selecting a plan below.`
              : "Pick the plan that fits your project. You can upgrade or cancel any time."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Period toggle */}
          <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-muted/40 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={cn(
                "rounded-full px-4 py-1.5 transition",
                period === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPeriod("yearly")}
              className={cn(
                "rounded-full px-4 py-1.5 transition",
                period === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              Yearly <span className="ml-1 text-primary">save {yearlyDiscount}%</span>
            </button>
          </div>

          {/* Plan cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PLAN_ORDER.map((p) => {
              const meta = PLAN_PRICES[p];
              const cents = getPlanAmount(p, period);
              const active = plan === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card p-4 text-left transition hover:border-primary/60",
                    active ? "border-primary ring-2 ring-primary/25" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {p === "pro" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.tagline}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{formatAmount(cents, "USD")}</span>
                    <span className="text-xs text-muted-foreground">/{period === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {meta.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Site picker (only when no preset) */}
          {!presetSiteId && (
            <div className="space-y-2">
              <Label htmlFor="upgrade-site">Apply to site</Label>
              {sites === null ? (
                <Skeleton className="h-10 w-full" />
              ) : sites.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Create a project first, then come back to publish it.
                </p>
              ) : (
                <Select value={siteId ?? undefined} onValueChange={(v) => setSiteId(v)}>
                  <SelectTrigger id="upgrade-site">
                    <SelectValue placeholder="Pick a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} <span className="text-muted-foreground">— {s.status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleCheckout} disabled={submitting || !siteId}>
            <CreditCard className="mr-1.5 h-4 w-4" />
            {submitting ? "Redirecting…" : `Continue to payment`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
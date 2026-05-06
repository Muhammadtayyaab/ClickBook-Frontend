import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Crown, Lock, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import {
  cancelSubscription,
  PLAN_PRICES,
  type SubscriptionStatus,
} from "@/lib/payments-api";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface Props {
  status: SubscriptionStatus | null;
  loading: boolean;
  onChange?: () => void;
}

function planLabel(planKey: string): string {
  if (planKey === "free") return "Free";
  const meta = PLAN_PRICES[planKey as keyof typeof PLAN_PRICES];
  return meta?.label ?? planKey;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function PackageStatusCard({ status, loading, onChange }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelSubscription();
      try {
        const me = await apiFetch<{ data: AuthUser }>("/api/auth/me");
        setUser(me.data);
      } catch {
        // best-effort store refresh; the page reload below still picks it up
      }
      toast.success("Subscription cancelled. Your published sites stay live.");
      setCancelOpen(false);
      onChange?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to cancel subscription",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-8 w-32" />
        <Skeleton className="mt-4 h-2 w-full" />
      </div>
    );
  }

  const isPaid = status.is_active;
  const isExpiringSoon = isPaid && status.days_remaining <= 7;
  const isUnlimited = status.publish_limit === null;
  const usedPct = isUnlimited
    ? 0
    : Math.min(
        100,
        Math.round((status.publish_used / Math.max(1, status.publish_limit ?? 1)) * 100),
      );

  // Expired or never paid → upsell card
  if (!isPaid) {
    const everPaid = status.plan !== "free";
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/40 via-card to-card p-5">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {everPaid
                    ? `Your ${planLabel(status.plan)} plan ended${
                        status.expires_at ? ` on ${formatDate(status.expires_at)}` : ""
                      }`
                    : "You're on the Free plan"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {everPaid
                    ? "Sites you already published stay live. Subscribe again to publish more and unlock premium features."
                    : `You can publish ${status.publish_limit ?? 1} site on Free. Upgrade to publish more and unlock premium features.`}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Rocket className="h-3.5 w-3.5" />
                    {status.publish_used} published
                  </span>
                  {!isUnlimited && (
                    <span>
                      · {status.publish_remaining} of {status.publish_limit} slot
                      {status.publish_limit === 1 ? "" : "s"} left
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="hero" onClick={() => setUpgradeOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {everPaid ? "Resubscribe" : "Unlock premium features"}
            </Button>
          </div>
        </div>
        <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </>
    );
  }

  // Active paid plan
  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm",
          isExpiringSoon ? "border-amber-300/60" : "border-border",
        )}
      >
        <div
          className={cn(
            "absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
            isExpiringSoon ? "bg-amber-300/20" : "bg-primary/10",
          )}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isExpiringSoon
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{planLabel(status.plan)} plan</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isExpiringSoon
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {status.days_remaining === 0
                    ? "Expires today"
                    : `${status.days_remaining} day${status.days_remaining === 1 ? "" : "s"} left`}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {status.expires_at
                  ? `Renews on ${formatDate(status.expires_at)}`
                  : "Active subscription"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isExpiringSoon ? "hero" : "outline"}
              size="sm"
              onClick={() => setUpgradeOpen(true)}
            >
              {isExpiringSoon ? "Renew now" : "Manage plan"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Published sites</span>
            <span className="font-medium">
              {isUnlimited
                ? `${status.publish_used} / Unlimited`
                : `${status.publish_used} / ${status.publish_limit}`}
            </span>
          </div>
          {!isUnlimited && <Progress value={usedPct} />}
          {isUnlimited ? (
            <p className="mt-1 text-xs text-muted-foreground">
              You can publish as many sites as you like on Business.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {status.publish_remaining === 0
                ? "You've used all your publish slots. Unpublish a site or upgrade for more."
                : `${status.publish_remaining} more publish${status.publish_remaining === 1 ? "" : "es"} available`}
            </p>
          )}
        </div>
      </div>
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <AlertDialog open={cancelOpen} onOpenChange={(o) => !cancelling && setCancelOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your {planLabel(status.plan)} subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be moved to the Free plan immediately and lose the
              {status.days_remaining > 0
                ? ` ${status.days_remaining} day${status.days_remaining === 1 ? "" : "s"} you have left`
                : " remaining time on your plan"}
              . No refund is issued. Sites you've already published stay live, but
              you won't be able to publish new ones beyond the Free plan limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

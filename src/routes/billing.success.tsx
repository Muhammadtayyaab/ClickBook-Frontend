import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyStripeSession } from "@/lib/payments-api";
import { APP_NAME } from "@/lib/brand";

interface Search {
  session_id?: string;
  payment_id?: string;
}

export const Route = createFileRoute("/billing/success")({
  head: () => ({ meta: [{ title: `Payment success — ${APP_NAME}` }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    payment_id: typeof s.payment_id === "string" ? s.payment_id : undefined,
  }),
  component: BillingSuccess,
});

type Phase = "verifying" | "paid" | "unpaid" | "missing";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30_000;
const REDIRECT_DELAY_MS = 1500;

function BillingSuccess() {
  const navigate = useNavigate();
  const { session_id } = useSearch({ from: "/billing/success" });
  const [phase, setPhase] = useState<Phase>("verifying");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!session_id) {
      setPhase("missing");
      return;
    }

    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        const res = await verifyStripeSession(session_id!);
        if (cancelled) return;

        if (res.status === "paid") {
          setPhase("paid");
          redirectTimer = setTimeout(() => {
            navigate({ to: "/dashboard/projects", replace: true });
          }, REDIRECT_DELAY_MS);
          return;
        }

        if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
          setPhase("unpaid");
          return;
        }
        setTimeout(check, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
          setPhase("unpaid");
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [session_id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        {phase === "verifying" && (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We're verifying your payment with Stripe. This usually takes just a few seconds.
            </p>
          </div>
        )}

        {phase === "paid" && (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Payment successful</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your project is being prepared. Redirecting you to the dashboard…
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/dashboard/projects">Go to dashboard now</Link>
              </Button>
            </div>
          </div>
        )}

        {phase === "unpaid" && (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Payment not confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Stripe has not confirmed this payment yet. If you completed checkout, your dashboard
              will update automatically once the payment clears.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild variant="outline">
                <Link to="/dashboard/settings">View billing</Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard/projects">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        )}

        {phase === "missing" && (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Missing session</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a payment session in the URL.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/dashboard/settings">Back to billing</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
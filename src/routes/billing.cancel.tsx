import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleSlash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/billing/cancel")({
  head: () => ({ meta: [{ title: `Payment cancelled — ${APP_NAME}` }] }),
  component: BillingCancel,
});

function BillingCancel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CircleSlash className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Checkout cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No charge was made. You can come back any time to publish your site.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="hero">
            <Link to="/dashboard/projects">Back to projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/settings">Try a different plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

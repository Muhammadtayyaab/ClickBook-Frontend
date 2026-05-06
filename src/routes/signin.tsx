import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { authRedirectHref, sanitizeIntent, sanitizeRedirect, type PostAuthIntent } from "@/lib/redirect";

interface AuthSearch {
  redirect?: string;
  intent?: PostAuthIntent;
}

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      { name: "description", content: `Sign in to your ${APP_NAME} account.` },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: sanitizeRedirect(search.redirect),
    intent: sanitizeIntent(search.intent),
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { redirect, intent } = useSearch({ from: "/signin" });
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (redirect) {
        // Honor the page the user came from; forward `intent` so that page can
        // resume the action (e.g. auto-trigger publish).
        const search = intent ? { intent } : undefined;
        navigate({ to: redirect, search, replace: true });
        return;
      }
      // Admins land on the admin panel; everyone else goes to the user dashboard.
      navigate({ to: user.role === "admin" ? "/admin" : "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  const signupHref = redirect ? authRedirectHref("/signup", redirect, intent) : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-xl tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue building.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" size="lg" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to {APP_NAME}?{" "}
            <Link to={signupHref} className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

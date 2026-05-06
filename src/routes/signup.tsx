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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: `Create account — ${APP_NAME}` },
      { name: "description", content: `Create your ${APP_NAME} account and start building in minutes.` },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: sanitizeRedirect(search.redirect),
    intent: sanitizeIntent(search.intent),
  }),
  component: SignUpPage,
});

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(name: string, email: string, password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (password !== confirm) errors.confirm = "Passwords do not match.";
  return errors;
}

function SignUpPage() {
  const navigate = useNavigate();
  const { redirect, intent } = useSearch({ from: "/signup" });
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const v = validate(name, email, password, confirm);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      if (redirect) {
        const search = intent ? { intent } : undefined;
        navigate({ to: redirect, search, replace: true });
        return;
      }
      navigate({ to: user.role === "admin" ? "/admin" : "/dashboard", replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend returns 409 for duplicate email; surface field-specific when possible.
        if (err.status === 409) setErrors({ email: err.message });
        else setServerError(err.message);
      } else {
        setServerError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start building beautiful websites in minutes.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
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
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
            {serverError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}
            <Button type="submit" size="lg" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={redirect ? authRedirectHref("/signin", redirect, intent) : "/signin"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
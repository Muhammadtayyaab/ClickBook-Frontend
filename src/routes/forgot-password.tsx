import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: `Forgot password — ${APP_NAME}` },
      { name: "description", content: `Reset your ${APP_NAME} password.` },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateEmail(value: string): string | null {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email.";
    return null;
  }

  async function sendResetEmail() {
    const v = validateEmail(email);
    setEmailError(v);
    if (v) return;
    setError(null);
    setMessage(null);
    setResetLink(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ data?: { message?: string; reset_link?: string } }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(res?.data?.message ?? "If that email exists, we've sent a reset link. Check your inbox.");
      if (res?.data?.reset_link) setResetLink(res.data.reset_link);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendResetEmail();
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
          <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset it.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {message && (
              <div className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <div>{message}</div>
                {resetLink && (
                  <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground">
                    <div className="font-medium">Reset link (dev)</div>
                    <a className="break-all underline" href={resetLink}>
                      {resetLink}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={sendResetEmail}
                    disabled={loading || !email}
                  >
                    {loading ? "Sending…" : "Resend email"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Didn’t get it? Check spam/junk, then resend.
                  </span>
                </div>
              </div>
            )}
            <Button type="submit" size="lg" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
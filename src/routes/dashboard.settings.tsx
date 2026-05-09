import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Mail, Receipt, ShieldCheck, User } from "lucide-react";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatAmount,
  getSubscriptionStatus,
  listMyPayments,
  type PaymentRecord,
  type SubscriptionStatus,
} from "@/lib/payments-api";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notifications-api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [paymentsErr, setPaymentsErr] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatar_url ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<{
    name?: string;
    email?: string;
    avatar_url?: string;
  }>({});

  async function loadPayments() {
    try {
      const res = await listMyPayments({ per_page: 10 });
      setPayments(res.data);
      setPaymentsErr(null);
    } catch (err) {
      setPayments([]);
      setPaymentsErr(err instanceof ApiError ? err.message : "Failed to load billing history");
    }
  }

  async function loadSubscription() {
    try {
      setSubscription(await getSubscriptionStatus());
    } catch {
      setSubscription(null);
    }
  }

  useEffect(() => {
    loadPayments();
    loadSubscription();
  }, []);

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfileEmail(user?.email ?? "");
    setProfileAvatarUrl(user?.avatar_url ?? "");
  }, [user?.name, user?.email, user?.avatar_url]);

  function validateProfile() {
    const errs: { name?: string; email?: string; avatar_url?: string } = {};
    if (profileName.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!profileEmail.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim()))
      errs.email = "Enter a valid email.";
    if (profileAvatarUrl.trim()) {
      try {
        const u = new URL(profileAvatarUrl.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:")
          errs.avatar_url = "Avatar URL must start with http(s)://";
      } catch {
        errs.avatar_url = "Enter a valid URL.";
      }
    }
    return errs;
  }

  async function saveProfile() {
    if (!user) return;
    const errs = validateProfile();
    setProfileFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setProfileSaving(true);
    setProfileErr(null);
    setProfileOk(null);
    try {
      const res = await apiFetch<{ data: typeof user }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          avatar_url: profileAvatarUrl || null,
        }),
      });
      setUser(res.data);
      setProfileOk("Saved");
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and billing.</p>
      </div>

      <SettingsSection icon={User} title="Profile" description="Your account identity across ClickBook.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value);
                if (profileFieldErrors.name)
                  setProfileFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              autoComplete="name"
              aria-invalid={!!profileFieldErrors.name}
            />
            {profileFieldErrors.name && (
              <p className="text-xs text-destructive">{profileFieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileEmail}
              onChange={(e) => {
                setProfileEmail(e.target.value);
                if (profileFieldErrors.email)
                  setProfileFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              autoComplete="email"
              aria-invalid={!!profileFieldErrors.email}
            />
            {profileFieldErrors.email && (
              <p className="text-xs text-destructive">{profileFieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={profileAvatarUrl ?? ""}
              onChange={(e) => {
                setProfileAvatarUrl(e.target.value);
                if (profileFieldErrors.avatar_url)
                  setProfileFieldErrors((p) => ({ ...p, avatar_url: undefined }));
              }}
              placeholder="https://..."
              autoComplete="url"
              aria-invalid={!!profileFieldErrors.avatar_url}
            />
            {profileFieldErrors.avatar_url && (
              <p className="text-xs text-destructive">{profileFieldErrors.avatar_url}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs">
            {profileErr ? <span className="text-destructive">{profileErr}</span> : null}
            {!profileErr && profileOk ? <span className="text-muted-foreground">{profileOk}</span> : null}
          </div>
          <Button onClick={saveProfile} disabled={!user || profileSaving}>
            {profileSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection icon={CreditCard} title="Plan" description="Your current subscription.">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
          <div>
            <p className="text-sm font-medium capitalize">
              {subscription?.effective_plan ?? user?.plan ?? "free"} plan
            </p>
            <p className="text-xs text-muted-foreground">
              {subscription?.is_active
                ? `${subscription.days_remaining} day${
                    subscription.days_remaining === 1 ? "" : "s"
                  } left · manage billing or change your plan.`
                : "Pick a plan to publish your sites."}
            </p>
          </div>
          <Button variant="hero" size="sm" onClick={() => setUpgradeOpen(true)}>
            {subscription?.is_active ? "Change plan" : "Upgrade"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection icon={Receipt} title="Billing history" description="Recent payments and receipts.">
        <BillingHistory payments={payments} error={paymentsErr} />
      </SettingsSection>

      <SettingsSection icon={ShieldCheck} title="Security" description="Password and session controls.">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted-foreground">We recommend updating every 90 days.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
            Change password
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Mail}
        title="Email & Notifications"
        description="Choose where contact-form messages from your sites are delivered."
      >
        <NotificationsForm />
      </SettingsSection>

      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setOk(null);
    if (!current || !next || !confirm) {
      setErr("Please fill in all fields.");
      return;
    }
    if (next.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (next === current) {
      setErr("New password must be different from your current password.");
      return;
    }
    if (next !== confirm) {
      setErr("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      setOk("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Choose a strong password you don’t reuse elsewhere.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          {!err && ok ? <p className="text-sm text-muted-foreground">{ok}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Updating..." : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BillingHistory({ payments, error }: { payments: PaymentRecord[] | null; error: string | null }) {
  if (payments === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        {error}
      </p>
    );
  }
  if (payments.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        No payments yet — your receipts will appear here.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Plan</th>
            <th className="px-3 py-2 font-medium">Amount</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-3 py-2 capitalize">
                {p.plan} <span className="text-xs text-muted-foreground">/ {p.billing_period}</span>
              </td>
              <td className="px-3 py-2">{formatAmount(p.amount, p.currency)}</td>
              <td className="px-3 py-2">
                <StatusPill status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: PaymentRecord["status"] }) {
  const cfg = {
    completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    failed: "bg-destructive/15 text-destructive",
  }[status];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cfg)}>
      {status}
    </span>
  );
}

function NotificationsForm() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationPrefs()
      .then((data) => {
        if (cancelled) return;
        setPrefs(data);
        setEnabled(data.email_notifications_enabled);
        setContactEmail(data.contact_email);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.message : "Failed to load notification settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validateEmail(value: string): boolean {
    if (!value.trim()) {
      setEmailErr("Contact email is required.");
      return false;
    }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    if (!ok) {
      setEmailErr("Please enter a valid email address.");
      return false;
    }
    setEmailErr(null);
    return true;
  }

  async function save() {
    if (!validateEmail(contactEmail)) return;
    setSaving(true);
    try {
      await updateNotificationPrefs({
        email_notifications_enabled: enabled,
        contact_email: contactEmail.trim(),
      });
      setPrefs((p) =>
        p ? { ...p, email_notifications_enabled: enabled, contact_email: contactEmail.trim() } : p,
      );
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  const dirty =
    !!prefs &&
    (enabled !== prefs.email_notifications_enabled || contactEmail.trim() !== prefs.contact_email);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/40 p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Enable email notifications</p>
          <p className="text-xs text-muted-foreground">
            When off, contact-form messages from your published sites will be silently dropped.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable email notifications" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          type="email"
          value={contactEmail}
          onChange={(e) => {
            setContactEmail(e.target.value);
            if (emailErr) setEmailErr(null);
          }}
          onBlur={(e) => validateEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={!enabled}
        />
        <p className="text-xs text-muted-foreground">
          Where messages from your website's contact forms will be delivered.
          {prefs?.is_default_email ? " Defaults to your account email." : null}
        </p>
        {emailErr ? <p className="text-xs text-destructive">{emailErr}</p> : null}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

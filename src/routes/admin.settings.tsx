import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getActivity, type ActivityEntry } from "@/lib/admin-api";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    getActivity(50)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Password change failed");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, security, and preferences.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Profile</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Plan</Label>
            <p className="font-medium capitalize">{user?.plan}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Currently using {theme} mode</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Switch to {theme === "dark" ? "light" : "dark"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Change password</h3>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={changingPw}>
              {changingPw ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6">
          <h3 className="text-sm font-semibold">Audit log</h3>
          <p className="text-xs text-muted-foreground">Most recent 50 admin actions across the platform.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Meta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-5 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No audit events yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.actor?.name ?? "system"}</div>
                    {log.actor?.email && (
                      <div className="text-xs text-muted-foreground">{log.actor.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="text-xs">
                    {log.target_type ? `${log.target_type}:${log.target_id?.slice(0, 8)}…` : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                    {Object.keys(log.meta).length ? JSON.stringify(log.meta) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

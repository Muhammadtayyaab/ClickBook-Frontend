import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, DollarSign, LayoutTemplate, Users } from "lucide-react";
import { toast } from "sonner";
import { getActivity, getDashboard, type ActivityEntry, type DashboardStats } from "@/lib/admin-api";
import { KpiCard } from "@/components/admin/kpi-card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatMonth(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short" });
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDashboard(), getActivity(15)])
      .then(([s, a]) => {
        if (!mounted) return;
        setStats(s);
        setActivity(a);
      })
      .catch((err) => toast.error(err?.message ?? "Failed to load dashboard"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  const revenueDelta = stats.prev_month_revenue
    ? ((stats.monthly_revenue - stats.prev_month_revenue) / stats.prev_month_revenue) * 100
    : undefined;

  const revenueChart = stats.revenue_by_month.map((r) => ({
    month: formatMonth(r.month),
    amount: r.amount,
  }));
  const signupsChart = stats.signups_by_month.map((r) => ({
    month: formatMonth(r.month),
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">Snapshot of platform health and activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total users" value={stats.total_users.toLocaleString()} icon={Users} sub={`${stats.new_signups_30d} in last 30d`} />
        <KpiCard label="Templates" value={stats.total_templates} icon={LayoutTemplate} sub="active" />
        <KpiCard
          label="Monthly revenue"
          value={USD.format(stats.monthly_revenue / 100)}
          icon={DollarSign}
          delta={revenueDelta}
          sub="vs. last 30d"
        />
        <KpiCard
          label="Active subscriptions"
          value={stats.active_subscriptions}
          icon={Activity}
          sub={`Churn ${stats.churn_rate.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Revenue</h3>
            <span className="text-xs text-muted-foreground">{USD.format(stats.total_revenue / 100)} all-time</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${v / 100}`} />
                <Tooltip
                  formatter={(v: number) => USD.format(v / 100)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">New signups</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">Recent activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Actions you take will appear here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="text-muted-foreground">{a.actor?.name ?? "system"}</span>
                    {" · "}
                    <span>{a.action}</span>
                    {a.target_type && <span className="text-muted-foreground"> ({a.target_type})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card lg:col-span-3" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card lg:col-span-2" />
      </div>
    </div>
  );
}

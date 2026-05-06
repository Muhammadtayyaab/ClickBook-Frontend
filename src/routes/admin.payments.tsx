import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Activity, CreditCard, DollarSign, Download, TrendingDown } from "lucide-react";
import {
  downloadCsv,
  getDashboard,
  listPayments,
  type AdminPayment,
  type DashboardStats,
  type Paginated,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/admin/kpi-card";
import { PaginationControls } from "@/components/admin/pagination-controls";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
});

const PER_PAGE = 10;
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatMonth(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function PaymentsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [payments, setPayments] = useState<Paginated<AdminPayment> | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getDashboard().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPayments({
        email,
        status: status === "all" ? undefined : status,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: PER_PAGE,
      });
      setPayments(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [email, status, dateFrom, dateTo, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleExport() {
    try {
      await downloadCsv("/api/admin/payments/export-csv", "payments.csv");
      toast.success("Export started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  const revenueChart = (stats?.revenue_by_month ?? []).map((r) => ({ month: formatMonth(r.month), amount: r.amount }));
  const signupsChart = (stats?.signups_by_month ?? []).map((r) => ({ month: formatMonth(r.month), count: r.count }));
  const revenueDelta = stats && stats.prev_month_revenue
    ? ((stats.monthly_revenue - stats.prev_month_revenue) / stats.prev_month_revenue) * 100
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-sm text-muted-foreground">Revenue overview and transaction log.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total revenue"
          value={USD.format((stats?.total_revenue ?? 0) / 100)}
          icon={DollarSign}
          sub="all time"
        />
        <KpiCard
          label="Monthly revenue"
          value={USD.format((stats?.monthly_revenue ?? 0) / 100)}
          icon={CreditCard}
          delta={revenueDelta}
          sub="last 30d"
        />
        <KpiCard
          label="Active subscriptions"
          value={stats?.active_subscriptions ?? 0}
          icon={Activity}
        />
        <KpiCard
          label="Churn rate"
          value={`${(stats?.churn_rate ?? 0).toFixed(1)}%`}
          icon={TrendingDown}
          sub="last 30d"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Revenue trend</h3>
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Signups by month</h3>
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

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="email-filter" className="text-xs">Email</Label>
            <Input
              id="email-filter"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs">From</Label>
            <Input id="date-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs">To</Label>
            <Input id="date-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : payments && payments.data.length > 0 ? (
              payments.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{p.user_name}</div>
                    <div className="text-xs text-muted-foreground">{p.user_email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.plan} · {p.billing_period}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{USD.format(p.amount / 100)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.status === "completed" ? "default" : p.status === "failed" ? "destructive" : "secondary"}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No transactions match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {payments && (
          <PaginationControls
            page={payments.page}
            pages={payments.pages}
            total={payments.total}
            perPage={payments.per_page}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

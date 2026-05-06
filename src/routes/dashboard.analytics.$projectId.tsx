import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSummary,
  getTimeseries,
  getTopPages,
  type AnalyticsPoint,
  type AnalyticsRange,
  type AnalyticsSummary,
  type TopPage,
} from "@/lib/analytics-api";
import { listProjects, type ProjectCard } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/analytics/$projectId")({
  component: AnalyticsPage,
});

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];

function AnalyticsPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectCard[] | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<AnalyticsPoint[] | null>(null);
  const [topPages, setTopPagesState] = useState<TopPage[] | null>(null);
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load owned projects once for the switcher.
  useEffect(() => {
    listProjects({ status: "all" })
      .then((res) => setProjects(res.data))
      .catch(() => {
        // Don't block the page on the switcher failing.
      });
  }, []);

  // Summary + top pages (depend on project, not range).
  useEffect(() => {
    let cancelled = false;
    setLoadingMain(true);
    setError(null);
    Promise.all([getSummary(projectId), getTopPages(projectId, "30d", 5)])
      .then(([s, tp]) => {
        if (cancelled) return;
        setSummary(s);
        setTopPagesState(tp);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load analytics";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => !cancelled && setLoadingMain(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Time series — refetch when range changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    getTimeseries(projectId, range)
      .then((s) => !cancelled && setSeries(s))
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err instanceof ApiError ? err.message : "Failed to load chart",
        );
      })
      .finally(() => !cancelled && setLoadingChart(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, range]);

  const project = useMemo(
    () => projects?.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  const hasAnyData = !!summary && summary.total_views > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Analytics
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {project?.name ?? "Site insights"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visitor traffic and engagement for your published site.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {projects && projects.length > 1 && (
            <Select
              value={projectId}
              onValueChange={(id) =>
                navigate({
                  to: "/dashboard/analytics/$projectId",
                  params: { projectId: id },
                })
              }
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="Pick a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {project?.hosted_url && (
            <Button asChild variant="outline" size="sm">
              <a href={project.hosted_url} target="_blank" rel="noreferrer">
                Visit site <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={<Eye className="h-4 w-4" />}
              label="Total views"
              value={summary?.total_views}
              loading={loadingMain}
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Today"
              value={summary?.views_today}
              loading={loadingMain}
            />
            <SummaryCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="This week"
              value={summary?.views_this_week}
              loading={loadingMain}
            />
            <SummaryCard
              icon={<CalendarRange className="h-4 w-4" />}
              label="This month"
              value={summary?.views_this_month}
              loading={loadingMain}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Views over time</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daily visits to your published pages.
                </p>
              </div>
              <Select
                value={range}
                onValueChange={(v) => setRange(v as AnalyticsRange)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartArea
                series={series}
                loading={loadingChart}
                hasAnyData={hasAnyData}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top pages (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <TopPagesTable rows={topPages} loading={loadingMain} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
          <span className="rounded-md bg-muted p-1.5 text-foreground/80">
            {icon}
          </span>
        </div>
        <div className="mt-3">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              {(value ?? 0).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartArea({
  series,
  loading,
  hasAnyData,
}: {
  series: AnalyticsPoint[] | null;
  loading: boolean;
  hasAnyData: boolean;
}) {
  if (loading || !series) {
    return <Skeleton className="h-[280px] w-full rounded-lg" />;
  }
  if (!hasAnyData) {
    return <EmptyState />;
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => formatDateTick(String(label), true)}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopPagesTable({
  rows,
  loading,
}: {
  rows: TopPage[] | null;
  loading: boolean;
}) {
  if (loading || !rows) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No traffic yet.
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.views), 1);
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.page_slug} className="flex items-center gap-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            /{row.page_slug === "(home)" ? "" : row.page_slug}
          </span>
          <div className="hidden flex-1 sm:block">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-primary")}
                style={{ width: `${(row.views / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
            {row.views.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <BarChart3 className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">No traffic yet</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Once visitors land on your published site, you'll see daily views here.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to="/dashboard/projects">Manage projects</Link>
      </Button>
    </div>
  );
}

function formatDateTick(value: string, full = false): string {
  // value is ISO yyyy-mm-dd
  const d = new Date(value + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: full ? "numeric" : undefined,
  });
}
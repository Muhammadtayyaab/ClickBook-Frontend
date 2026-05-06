import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Eye,
  FileText,
  FolderKanban,
  Globe,
  Plus,
  Rocket,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { PackageStatusCard } from "@/components/dashboard/package-status-card";
import { getStats, type ProjectStats } from "@/lib/projects-api";
import { getSubscriptionStatus, type SubscriptionStatus } from "@/lib/payments-api";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, sub] = await Promise.all([
        getStats(),
        getSubscriptionStatus().catch(() => null),
      ]);
      setStats(s);
      setSubscription(sub);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latestDraft = stats?.recent.find((p) => p.status === "draft");

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-subtle p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up where you left off or start something new.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {latestDraft && (
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/editor/$templateId",
                  params: { templateId: latestDraft.template_id },
                  search: { siteId: latestDraft.id },
                })
              }
            >
              Continue editing <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          <Button variant="hero" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      {/* Package status */}
      <PackageStatusCard status={subscription} loading={loading} onChange={load} />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total projects"
          value={stats?.total ?? 0}
          icon={FolderKanban}
          accent="from-primary to-primary/60"
          loading={loading}
        />
        <StatCard
          label="Drafts"
          value={stats?.drafts ?? 0}
          icon={FileText}
          accent="from-muted-foreground to-muted-foreground/60"
          loading={loading}
        />
        <StatCard
          label="Published"
          value={stats?.published ?? 0}
          icon={Rocket}
          accent="from-emerald-500 to-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Total views"
          value={stats?.total_views ?? 0}
          icon={Eye}
          accent="from-sky-500 to-sky-400"
          loading={loading}
        />
      </div>

      {/* Two-column: recent + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent projects</h3>
            <Link to="/dashboard/projects" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : stats && stats.recent.length > 0 ? (
            <ul className="divide-y divide-border">
              {stats.recent.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.template_name ?? "Custom"} ·{" "}
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <StatusChip status={p.status} />
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      to="/editor/$templateId"
                      params={{ templateId: p.template_id }}
                      search={{ siteId: p.id }}
                    >
                      Edit
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          )}
        </div>

        <div className="space-y-4">
          <QuickAction
            icon={Plus}
            title="Create a new project"
            description="Pick a template and start designing"
            onClick={() => setCreateOpen(true)}
          />
          <QuickAction
            icon={Globe}
            title="Browse templates"
            description="Explore our full template library"
            to="/dashboard/templates"
          />
          <QuickAction
            icon={Activity}
            title="Manage hosted sites"
            description="View and manage your live sites"
            to="/dashboard/hosted"
          />
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof FolderKanban;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10", accent)} />
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  to,
  onClick,
}: {
  icon: typeof Plus;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
}) {
  const body = (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={to as any} className="block">
        {body}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  );
}

function StatusChip({ status }: { status: ProjectStats["recent"][number]["status"] }) {
  return <StatusBadge status={status} />;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">No projects yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Create your first website in seconds.
      </p>
      <Button variant="hero" size="sm" className="mt-4" onClick={onCreate}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Create project
      </Button>
    </div>
  );
}
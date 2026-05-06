import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/project-card";
import { listProjects, unpublishProject, type ProjectCard } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/hosted")({
  component: HostedSitesPage,
});

function HostedSitesPage() {
  const [items, setItems] = useState<ProjectCard[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await listProjects({ status: "published" });
      setItems(res.data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnpublish(id: string) {
    try {
      await unpublishProject(id);
      toast.success("Site unpublished");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/site/${id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hosted Sites</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your published websites. Share the live link or unpublish anytime.
        </p>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Globe className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">No live sites yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Publish a project to see it here with its live URL.
          </p>
          <Button asChild variant="hero" className="mt-5">
            <Link to="/dashboard/projects">
              <Rocket className="mr-1 h-4 w-4" /> Go to projects
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                    <Globe className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{p.name}</h3>
                  <span className="relative">
                    <span className="relative inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {p.template_name ?? "Custom"} · Published{" "}
                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "recently"} · {p.page_views.toLocaleString()} views
                </p>
                <code className="mt-1 inline-block truncate text-[11px] text-muted-foreground">
                  /site/{p.id}
                </code>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(p.id)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/site/$siteId" params={{ siteId: p.id }} target="_blank">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleUnpublish(p.id)}>
                  Unpublish
                </Button>
              </div>
              {/* hidden status used by accessibility tools / card consistency */}
              <span className="sr-only">
                <StatusBadge status={p.status} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
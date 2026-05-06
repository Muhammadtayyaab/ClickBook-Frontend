import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderKanban, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCardView } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { RenameDialog } from "@/components/dashboard/rename-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import {
  deleteProject,
  duplicateProject,
  listProjects,
  publishProject,
  renameProject,
  unpublishProject,
  type ProjectCard,
  type ProjectStatus,
} from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
});

type Filter = "all" | ProjectStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
];

function ProjectsPage() {
  const [items, setItems] = useState<ProjectCard[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProjectCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCard | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<ProjectCard | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await listProjects({ status: filter });
      setItems(res.data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, [filter]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, search]);

  async function handleDuplicate(p: ProjectCard) {
    try {
      await duplicateProject(p.id);
      toast.success("Project duplicated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Duplicate failed");
    }
  }

  async function handlePublishToggle(p: ProjectCard) {
    if (publishingId) return;
    if (p.status === "published") {
      try {
        setPublishingId(p.id);
        await unpublishProject(p.id);
        toast.success("Site unpublished");
        load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Action failed");
      } finally {
        setPublishingId(null);
      }
      return;
    }
    try {
      setPublishingId(p.id);
      await publishProject(p.id);
      toast.success("Site published");
      load();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 402 || err.status === 403)) {
        // Backend still gates publishing behind payment — fall back to upsell.
        setUpgradeTarget(p);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Publish failed");
      }
    } finally {
      setPublishingId(null);
    }
  }

  async function handleRename(name: string) {
    if (!renameTarget) return;
    try {
      await renameProject(renameTarget.id, name);
      toast.success("Renamed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Rename failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success("Project deleted");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit drafts, publish finished sites, and duplicate winners.
          </p>
        </div>
        <Button variant="hero" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> New project
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                filter === f.key
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid / empty / loading */}
      {filtered === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasQuery={search.length > 0 || filter !== "all"}
          onCreate={() => setCreateOpen(true)}
          onClear={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProjectCardView
              key={p.id}
              project={p}
              onRename={() => setRenameTarget(p)}
              onDelete={() => setDeleteTarget(p)}
              onDuplicate={() => handleDuplicate(p)}
              onPublishToggle={() => handlePublishToggle(p)}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      {renameTarget && (
        <RenameDialog
          open
          initial={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onConfirm={handleRename}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          open
          title={`Delete "${deleteTarget.name}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
      <UpgradeDialog
        open={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        presetSiteId={upgradeTarget?.id}
        presetSiteName={upgradeTarget?.name}
      />
    </div>
  );
}

function EmptyState({
  hasQuery,
  onCreate,
  onClear,
}: {
  hasQuery: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow">
        {hasQuery ? <Search className="h-7 w-7" /> : <FolderKanban className="h-7 w-7" />}
      </div>
      {hasQuery ? (
        <>
          <h3 className="text-lg font-semibold">No matching projects</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different search term or clear the filters.
          </p>
          <Button variant="outline" className="mt-5" onClick={onClear}>
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">Start your first project</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Choose from beautiful templates and launch a site in minutes.
          </p>
          <Button variant="hero" className="mt-5" onClick={onCreate}>
            <Sparkles className="mr-1 h-4 w-4" /> Create project
          </Button>
        </>
      )}
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageOff, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { listBackendTemplates, type BackendTemplate } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/templates")({
  component: DashboardTemplates,
});

function DashboardTemplates() {
  const [templates, setTemplates] = useState<BackendTemplate[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [preset, setPreset] = useState<string | null>(null);

  useEffect(() => {
    listBackendTemplates()
      .then(setTemplates)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load templates"));
  }, []);

  const categories = useMemo(() => {
    if (!templates) return ["all"];
    return ["all", ...Array.from(new Set(templates.map((t) => t.category)))];
  }, [templates]);

  const filtered = useMemo(() => {
    if (!templates) return null;
    return templates.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (query && !`${t.name} ${t.category} ${t.description ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [templates, query, category]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse professionally designed templates and start your next project.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
                category === c
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {c.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No templates match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onUse={() => setPreset(t.id)} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={!!preset}
        presetTemplateId={preset ?? undefined}
        onClose={() => setPreset(null)}
      />
    </div>
  );
}

function TemplateCard({ template, onUse }: { template: BackendTemplate; onUse: () => void }) {
  const [err, setErr] = useState(false);
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {template.thumbnail_url && !err ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            onError={() => setErr(true)}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-7 w-7" />
          </div>
        )}
        {template.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{template.name}</h3>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {template.category.replace("_", " ")} · {template.usage_count.toLocaleString()} sites built
            </p>
          </div>
        </div>
        {template.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        )}
        <Button variant="hero" className="mt-4 w-full" onClick={onUse}>
          Use this template
        </Button>
      </div>
    </div>
  );
}
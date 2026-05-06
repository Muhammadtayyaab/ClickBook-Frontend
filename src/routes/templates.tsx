import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, ImageOff, Monitor, Search, Smartphone, Sparkles, Tablet, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionRenderer } from "@/components/section-renderer";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { listBackendTemplates, type BackendTemplate } from "@/lib/projects-api";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { authRedirectHref } from "@/lib/redirect";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { SectionDef } from "@/data/sections";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: `Templates — ${APP_NAME}` },
      { name: "description", content: "Browse professionally designed website templates across business, fitness, real estate, and more." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [templates, setTemplates] = useState<BackendTemplate[] | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [previewing, setPreviewing] = useState<BackendTemplate | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);

  useEffect(() => {
    listBackendTemplates()
      .then(setTemplates)
      .catch(() => toast.error("Failed to load templates"));
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
  }, [templates, category, query]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Find your starting point</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {templates?.length ?? "Loading"} designer-made templates. Filter by category or search to find the perfect fit.
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
                  category === c
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {filtered === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No templates found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <TemplateCard
                  template={t}
                  onPreview={() => setPreviewing(t)}
                  onUse={() => setPresetId(t.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />

      {previewing && (
        <PreviewModal
          template={previewing}
          onClose={() => setPreviewing(null)}
          onUse={() => {
            setPresetId(previewing.id);
            setPreviewing(null);
          }}
        />
      )}
      <CreateProjectDialog
        open={!!presetId}
        presetTemplateId={presetId ?? undefined}
        onClose={() => setPresetId(null)}
      />
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: BackendTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const [err, setErr] = useState(false);
  const token = useAuthStore((s) => s.token);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
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
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-foreground/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="mr-1 h-4 w-4" /> Quick preview
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-xs capitalize text-muted-foreground">{template.category.replace("_", " ")}</p>
          </div>
        </div>
        {template.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {template.usage_count.toLocaleString()} sites built
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onPreview}>
            <Eye className="mr-1 h-4 w-4" /> Preview
          </Button>
          {token ? (
            <Button variant="hero" className="flex-1" onClick={onUse}>
              Use template <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              asChild
              variant="hero"
              className="flex-1"
            >
              <a href={authRedirectHref("/signup", "/templates")}>
                Use template <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: BackendTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sections, setSections] = useState<SectionDef[] | null>(null);

  useEffect(() => {
    // Fetch full template from backend (list endpoint omits sections_config).
    apiFetch<{ data: { sections_config: SectionDef[] } }>(`/api/templates/${template.id}`)
      .then((r) => setSections(r.data.sections_config ?? []))
      .catch(() => setSections([]));
  }, [template.id]);

  const widthClass = device === "desktop" ? "max-w-full" : device === "tablet" ? "max-w-[820px]" : "max-w-[400px]";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{template.name}</h3>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {template.category.replace("_", " ")} · {template.description ?? ""}
          </p>
        </div>
        <div className="hidden items-center gap-1 rounded-lg border border-border bg-card p-1 sm:flex">
          {([
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone],
          ] as const).map(([d, Icon]) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-md",
                device === d ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={d}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" onClick={onUse}>
            Use this template
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close preview">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8">
        <div className={cn("mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-lg transition-all", widthClass)}>
          {sections === null ? (
            <div className="flex h-[60vh] items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading preview…</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex h-[60vh] items-center justify-center">
              <p className="text-sm text-muted-foreground">No preview available.</p>
            </div>
          ) : (
            sections.filter((s) => s.visible !== false).map((s) => <SectionRenderer key={s.id} section={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Undo2, Redo2, Monitor, Tablet, Smartphone, Eye, Save, Rocket, Sparkles,
  ChevronUp, ChevronDown, Copy, Trash2, Layers, FileText, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveSections, useAnyDirty, useEditor, type PageSlug } from "@/stores/editor-store";
import { themeStyleVars } from "@/lib/theme";
import { SectionRenderer } from "@/components/section-renderer";
import { SectionsPanel } from "@/components/editor/sections-panel";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { SectionPickerDrawer } from "@/components/editor/section-picker-drawer";
import { TEMPLATES } from "@/data/templates";
import { APP_NAME } from "@/lib/brand";
import { useAuthStore } from "@/stores/auth-store";
import { authRedirectHref, sanitizeIntent, type PostAuthIntent } from "@/lib/redirect";
import {
  getProject,
  publishProject,
  renameProject,
  saveSections,
  updateGlobalStyles,
} from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import type { SectionDef } from "@/data/sections";

interface EditorSearch {
  intent?: PostAuthIntent;
  siteId?: string;
  from?: string;
}

function sanitizeSiteId(value: unknown): string | undefined {
  return typeof value === "string" && /^[0-9a-f-]{10,}$/i.test(value) ? value : undefined;
}

function sanitizeFrom(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  // Only allow internal absolute paths, no protocol-relative or full URLs.
  if (!v.startsWith("/")) return undefined;
  if (v.startsWith("//")) return undefined;
  if (v.includes("://")) return undefined;
  return v;
}

export const Route = createFileRoute("/editor/$templateId")({
  head: ({ params }) => ({
    meta: [
      { title: `Editing — ${params.templateId} — ${APP_NAME}` },
      { name: "description", content: "Visual website editor — drag, drop, and customize every section." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): EditorSearch => ({
    intent: sanitizeIntent(search.intent),
    siteId: sanitizeSiteId(search.siteId),
    from: sanitizeFrom(search.from),
  }),
  component: EditorPage,
});

function EditorPage() {
  const { templateId } = useParams({ from: "/editor/$templateId" });
  const { intent, siteId, from } = useSearch({ from: "/editor/$templateId" });
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const isAuthed = Boolean(token);
  const {
    siteName, setSiteName, selectedId, select, device, setDevice,
    undo, redo, history, future, loadTemplate, hydrateFromBackend, markPageClean,
    moveSection, duplicateSection, removeSection,
    siteId: storeSiteId,
    pages, activeSlug, switchPage, themeColor, markMetaClean,
  } = useEditor();
  const sections = useActiveSections();
  const themeStyle = themeStyleVars(themeColor);
  const anyDirty = useAnyDirty();
  const metaDirty = useEditor((s) => s.metaDirty);
  const [tab, setTab] = useState<"sections" | "pages">("sections");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const didAutoPublish = useRef(false);
  // Used by the interval to read fresh state without re-subscribing.
  const stateRef = useRef({ siteId: storeSiteId, pages, siteName, themeColor, metaDirty: useEditor.getState().metaDirty });
  stateRef.current = { siteId: storeSiteId, pages, siteName, themeColor, metaDirty: useEditor.getState().metaDirty };

  const template = TEMPLATES.find((t) => t.id === templateId);

  // Load content: either from the backend (siteId) or the hardcoded template.
  useEffect(() => {
    let cancelled = false;
    if (siteId && isAuthed) {
      getProject(siteId)
        .then((project) => {
          if (cancelled) return;
          const gs = (project.global_styles ?? {}) as { colors?: { primary?: string } };
          hydrateFromBackend({
            siteId: project.id,
            name: project.name,
            themeColor: gs.colors?.primary,
            pages: project.pages.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              order: p.order,
              is_homepage: p.is_homepage,
              sections: (p.sections ?? []) as unknown as SectionDef[],
            })),
          });
          if (project.status === "published") setPublishedId(project.id);
        })
        .catch((err) => {
          if (cancelled) return;
          toast.error(err instanceof ApiError ? err.message : "Failed to load project");
          loadTemplate(templateId);
        });
    } else {
      loadTemplate(templateId);
    }
    return () => {
      cancelled = true;
    };
  }, [templateId, siteId, isAuthed, loadTemplate, hydrateFromBackend]);

  // Save every page that's currently dirty.
  const handleSave = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      const { siteId: currentId, pages: currentPages, siteName: currentName, themeColor: currentTheme } = stateRef.current;
      const metaDirty = useEditor.getState().metaDirty;
      if (!currentId) {
        if (!opts.silent) toast.message("Sign in to save your work");
        return false;
      }
      const dirtyPages = currentPages.filter((p) => p.dirty);
      if (dirtyPages.length === 0 && !metaDirty) {
        if (!opts.silent) toast.success("Nothing to save");
        return true;
      }
      try {
        if (!opts.silent) setSaving(true);
        for (const p of dirtyPages) {
          await saveSections(
            currentId,
            p.sections as unknown as Record<string, unknown>[],
            p.slug,
          );
          markPageClean(p.slug);
        }
        if (metaDirty) {
          await renameProject(currentId, currentName).catch(() => undefined);
          await updateGlobalStyles(currentId, {
            colors: { primary: currentTheme, background: "#ffffff", text: "#111827" },
            fonts: ["Inter", "Poppins"],
            spacing: { section_y: "80px" },
          }).catch(() => undefined);
          markMetaClean();
        }
        if (!opts.silent) toast.success("Saved");
        else toast.success("Draft auto-saved", { duration: 1500 });
        return true;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Save failed");
        return false;
      } finally {
        if (!opts.silent) setSaving(false);
      }
    },
    [markPageClean, markMetaClean],
  );

  // Auto-save every 30s when there's a backing site and any page is dirty.
  useEffect(() => {
    const i = setInterval(() => {
      const { siteId, pages } = stateRef.current;
      if (siteId && (pages.some((p) => p.dirty) || useEditor.getState().metaDirty)) {
        handleSave({ silent: true });
      }
    }, 30_000);
    return () => clearInterval(i);
  }, [handleSave]);

  const handlePublish = useCallback(async () => {
    if (!isAuthed) {
      const returnTo = `/editor/${templateId}${siteId ? `?siteId=${siteId}` : ""}`;
      navigate({ to: authRedirectHref("/signup", returnTo, "publish") });
      toast.message("Sign up to publish your site", { description: "It only takes a minute." });
      return;
    }
    if (!storeSiteId) {
      toast.error("Create a project first from the dashboard to publish.");
      return;
    }
    // Save the latest edits before sending the user to checkout — otherwise
    // the published version (set by the Stripe webhook) would lag the editor.
    setPublishing(true);
    try {
      await handleSave({ silent: true });
      const published = await publishProject(storeSiteId);
      setPublishedId(published.id);
      toast.success("Site published");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 402 || err.status === 403)) {
        setUpgradeOpen(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Publish failed");
      }
    } finally {
      setPublishing(false);
    }
  }, [isAuthed, navigate, templateId, siteId, storeSiteId, handleSave]);

  // Resume publish if user came back from auth with intent=publish.
  useEffect(() => {
    if (intent === "publish" && isAuthed && !didAutoPublish.current && storeSiteId) {
      didAutoPublish.current = true;
      handlePublish();
      navigate({
        to: "/editor/$templateId",
        params: { templateId },
        search: { siteId: storeSiteId },
        replace: true,
      });
    }
  }, [intent, isAuthed, handlePublish, navigate, templateId, storeSiteId]);

  const canvasWidth =
    device === "desktop" ? "max-w-full" : device === "tablet" ? "max-w-[820px]" : "max-w-[400px]";

  const backTo = isAuthed ? (from ?? "/dashboard/projects") : "/templates";

  function handleBack(e: React.MouseEvent) {
    e.preventDefault();
    // Prefer real browser-back so we return to the exact previous screen
    // (e.g. admin templates list) without re-triggering route guards.
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: backTo });
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={backTo}
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-hero text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="min-w-0 max-w-[260px] flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none hover:border-border focus:border-input focus:bg-background"
          />
          {template && (
            <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground sm:inline-flex">
              {template.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton onClick={undo} disabled={history.length === 0} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={redo} disabled={future.length === 0} aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <div className="hidden items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5 sm:flex">
            {([
              ["desktop", Monitor],
              ["tablet", Tablet],
              ["mobile", Smartphone],
            ] as const).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                aria-label={d}
                className={`flex h-7 w-8 items-center justify-center rounded ${
                  device === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {publishedId && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/site/$siteId" params={{ siteId: publishedId }} target="_blank">
                <ExternalLink className="mr-1 h-4 w-4" /> View live
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => window.open(`/site/${storeSiteId ?? ""}`, "_blank")} disabled={!publishedId}>
            <Eye className="mr-1 h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving || !storeSiteId}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : (anyDirty || metaDirty) ? "Save" : "Saved"}
          </Button>
          <Button variant="hero" size="sm" onClick={handlePublish} disabled={publishing}>
            <Rocket className="mr-1 h-4 w-4" /> {publishing ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </header>

      {/* Page tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-background px-3 py-1.5 overflow-x-auto">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => switchPage(p.slug as PageSlug)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeSlug === p.slug
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {p.name}
            {p.dirty && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Unsaved" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <div className="flex border-b border-sidebar-border">
            <TabButton active={tab === "sections"} onClick={() => setTab("sections")} icon={Layers}>
              Sections
            </TabButton>
            <TabButton active={tab === "pages"} onClick={() => setTab("pages")} icon={FileText}>
              Pages
            </TabButton>
          </div>
          <div className="flex-1 overflow-hidden">
            {tab === "sections" ? (
              <SectionsPanel onAdd={() => setPickerOpen(true)} />
            ) : (
              <PagesPanel />
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto" onClick={() => select(null)} style={themeStyle}>
          <div className={`mx-auto my-6 overflow-hidden rounded-xl border border-border bg-background shadow-md transition-all ${canvasWidth}`}>
            {sections.length === 0 ? (
              <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Layers className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">This page is empty</h3>
                <p className="mt-1 text-sm text-muted-foreground">Click "Add section" in the left panel to start.</p>
              </div>
            ) : (
              sections.filter((s) => s.visible).map((s) => (
                <CanvasSection
                  key={s.id}
                  selected={selectedId === s.id}
                  onSelect={() => select(s.id)}
                  onMoveUp={() => moveSection(s.id, "up")}
                  onMoveDown={() => moveSection(s.id, "down")}
                  onDuplicate={() => duplicateSection(s.id)}
                  onRemove={() => removeSection(s.id)}
                >
                  <SectionRenderer section={s} />
                </CanvasSection>
              ))
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-sidebar-border bg-sidebar lg:flex">
          <PropertiesPanel />
        </aside>
      </div>

      <SectionPickerDrawer open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        presetSiteId={storeSiteId ?? undefined}
        presetSiteName={siteName}
      />
    </div>
  );
}

function ToolbarButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function TabButton({
  active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function CanvasSection({
  children, selected, onSelect, onMoveUp, onMoveDown, onDuplicate, onRemove,
}: {
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`group relative cursor-pointer transition ${
        selected ? "outline outline-2 outline-offset-[-2px] outline-primary" : "hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-primary/30"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div className="pointer-events-auto mt-2 flex items-center gap-0.5 rounded-md border border-border bg-background/95 p-0.5 shadow-md backdrop-blur">
          <CanvasToolBtn onClick={(e) => { e.stopPropagation(); onMoveUp(); }} aria-label="Move up"><ChevronUp className="h-3.5 w-3.5" /></CanvasToolBtn>
          <CanvasToolBtn onClick={(e) => { e.stopPropagation(); onMoveDown(); }} aria-label="Move down"><ChevronDown className="h-3.5 w-3.5" /></CanvasToolBtn>
          <CanvasToolBtn onClick={(e) => { e.stopPropagation(); onDuplicate(); }} aria-label="Duplicate"><Copy className="h-3.5 w-3.5" /></CanvasToolBtn>
          <CanvasToolBtn onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Delete" className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></CanvasToolBtn>
        </div>
      </div>
      {children}
    </div>
  );
}

function CanvasToolBtn({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground ${className}`}
    />
  );
}

function PagesPanel() {
  const { pages, activeSlug, switchPage } = useEditor();
  return (
    <div className="p-2">
      {pages.map((p) => (
        <button
          key={p.slug}
          onClick={() => switchPage(p.slug as PageSlug)}
          className={`mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition hover:bg-sidebar-accent ${
            activeSlug === p.slug ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
          }`}
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">{p.name}</span>
          {p.is_homepage && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Home</span>
          )}
          {p.dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
        </button>
      ))}
    </div>
  );
}

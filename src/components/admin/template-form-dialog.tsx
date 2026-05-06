import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Eye, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  createTemplate,
  updateTemplate,
  type AdminTemplate,
} from "@/lib/admin-api";
import { createSection, defaultPageSections, type SectionDef, type SectionType, SECTION_LIBRARY } from "@/data/sections";
import { uploadImage } from "@/lib/projects-api";
import { SectionRenderer } from "@/components/section-renderer";
import { themeStyleVars } from "@/lib/theme";

const CATEGORIES = [
  "business", "gym", "spa", "real_estate", "restaurant",
  "portfolio", "agency", "medical", "education", "ecommerce",
] as const;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AdminTemplate | null;
  onSaved: () => void;
}

type PageSlug = "home" | "about" | "services" | "contact";

type TemplatePages = Record<PageSlug, { sections: SectionDef[] }>;

const PAGE_TABS: { slug: PageSlug; label: string }[] = [
  { slug: "home", label: "Home" },
  { slug: "about", label: "About" },
  { slug: "services", label: "Services" },
  { slug: "contact", label: "Contact" },
];

type GlobalStylesShape = {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  button_style: "rounded" | "square" | "pill";
  // Backward-compatible nested shape used by the renderer.
  colors?: { primary?: string; secondary?: string };
  typography?: { fontFamily?: string };
  components?: { buttonStyle?: string };
};

function buildDefaultPages(homeSections?: SectionDef[]): TemplatePages {
  return {
    home: { sections: homeSections ?? defaultPageSections("home") },
    about: { sections: defaultPageSections("about") },
    services: { sections: defaultPageSections("services") },
    contact: { sections: defaultPageSections("contact") },
  };
}

function coerceTemplatePages(t: AdminTemplate | null): TemplatePages {
  const raw = (t?.pages ?? null) as any;
  if (raw && typeof raw === "object") {
    const get = (slug: PageSlug): SectionDef[] | null => {
      const p = raw?.[slug];
      if (p && typeof p === "object" && Array.isArray(p.sections)) return p.sections as SectionDef[];
      return null;
    };
    const home = get("home") ?? ((t?.sections_config ?? []) as unknown as SectionDef[]);
    return {
      home: { sections: home },
      about: { sections: get("about") ?? defaultPageSections("about") },
      services: { sections: get("services") ?? defaultPageSections("services") },
      contact: { sections: get("contact") ?? defaultPageSections("contact") },
    };
  }
  return buildDefaultPages(((t?.sections_config ?? []) as unknown) as SectionDef[]);
}

function coerceStyles(t: AdminTemplate | null): GlobalStylesShape {
  const gs = (t?.global_styles ?? {}) as any;
  const primary =
    (typeof gs?.primary_color === "string" && gs.primary_color) ||
    (typeof gs?.colors?.primary === "string" && gs.colors.primary) ||
    "#6366f1";
  const secondary =
    (typeof gs?.secondary_color === "string" && gs.secondary_color) ||
    (typeof gs?.colors?.secondary === "string" && gs.colors.secondary) ||
    "#ffffff";
  const fontFamily =
    (typeof gs?.font_family === "string" && gs.font_family) ||
    (typeof gs?.typography?.fontFamily === "string" && gs.typography.fontFamily) ||
    "Inter";
  const buttonStyle =
    (gs?.button_style === "square" || gs?.button_style === "pill" || gs?.button_style === "rounded")
      ? gs.button_style
      : "rounded";
  return {
    primary_color: primary,
    secondary_color: secondary,
    font_family: fontFamily,
    button_style: buttonStyle,
    colors: { primary, secondary },
    typography: { fontFamily },
    components: { buttonStyle },
  };
}

function buttonRadiusPx(style: GlobalStylesShape["button_style"]): number {
  if (style === "square") return 6;
  if (style === "pill") return 999;
  return 12;
}

export function TemplateFormDialog({ open, onOpenChange, template, onSaved }: TemplateFormDialogProps) {
  const isEdit = !!template;
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("business");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [pages, setPages] = useState<TemplatePages>(() => buildDefaultPages());
  const [activePage, setActivePage] = useState<PageSlug>("home");
  const [styles, setStyles] = useState<GlobalStylesShape>(() => coerceStyles(null));
  const [activeTab, setActiveTab] = useState<"layout" | "styles">("layout");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? "");
    setCategory(template?.category ?? "business");
    setDescription(template?.description ?? "");
    setThumbnailUrl(template?.thumbnail_url ?? "");
    setPreviewUrl(template?.preview_url ?? "");
    setPages(coerceTemplatePages(template));
    setActivePage("home");
    setStyles(coerceStyles(template));
    setActiveTab("layout");
    setIsFeatured(template?.is_featured ?? false);
    setShowPreview(true);
  }, [open, template]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    // Minimal structural validation
    for (const { slug } of PAGE_TABS) {
      const list = pages?.[slug]?.sections;
      if (!Array.isArray(list)) {
        toast.error(`Invalid template structure: ${slug}.sections must be an array`);
        return;
      }
    }

    const body = {
      name: name.trim(),
      category,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      preview_url: previewUrl || null,
      pages,
      // Keep backward-compatible home sections synced
      sections_config: pages.home.sections as unknown as Array<Record<string, unknown>>,
      global_styles: {
        ...styles,
        colors: { primary: styles.primary_color, secondary: styles.secondary_color },
        typography: { fontFamily: styles.font_family },
        components: { buttonStyle: styles.button_style },
      } as Record<string, unknown>,
      is_featured: isFeatured,
    };

    setSubmitting(true);
    try {
      if (isEdit && template) {
        await updateTemplate(template.id, body);
        toast.success("Template updated");
      } else {
        await createTemplate(body);
        toast.success("Template created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  const activeSections = pages[activePage].sections;
  const themeVars = useMemo(() => themeStyleVars(styles.primary_color), [styles.primary_color]);
  const previewFont = styles.font_family || "Inter";
  const radius = buttonRadiusPx(styles.button_style);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Configure pages, sections, and global styles. Changes save as structured template JSON.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="thumb">Thumbnail URL</Label>
                    <Input id="thumb" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preview">Preview URL</Label>
                    <Input id="preview" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} />
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  Featured on landing page
                </label>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="layout">Pages & sections</TabsTrigger>
                    <TabsTrigger value="styles">Global styles</TabsTrigger>
                  </TabsList>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((p) => !p)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {showPreview ? "Hide preview" : "Show preview"}
                  </Button>
                </div>

                <TabsContent value="layout" className="mt-4">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <Tabs value={activePage} onValueChange={(v) => setActivePage(v as PageSlug)}>
                      <TabsList className="w-full justify-start">
                        {PAGE_TABS.map((p) => (
                          <TabsTrigger key={p.slug} value={p.slug}>{p.label}</TabsTrigger>
                        ))}
                      </TabsList>
                      {PAGE_TABS.map((p) => (
                        <TabsContent key={p.slug} value={p.slug} className="mt-4">
                          <SectionsEditor
                            sections={pages[p.slug].sections}
                            onChange={(next) => setPages((prev) => ({ ...prev, [p.slug]: { sections: next } }))}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="styles" className="mt-4">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <GlobalStylesEditor value={styles} onChange={setStyles} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Live preview */}
            <div className={`space-y-4 ${showPreview ? "" : "hidden lg:block"}`}>
              {showPreview ? (
                <div
                  className="sticky top-2 overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                  style={{ ...themeVars, fontFamily: previewFont } as any}
                >
                  <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Live preview · {PAGE_TABS.find((p) => p.slug === activePage)?.label}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: styles.primary_color }} />
                      <div className="h-3 w-3 rounded-full border" style={{ background: styles.secondary_color }} />
                      <span className="text-xs text-muted-foreground">{styles.font_family}</span>
                      <span className="ml-auto text-xs text-muted-foreground">Buttons: {styles.button_style}</span>
                    </div>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <div className="p-3">
                      <div className="mb-3 flex gap-2">
                        <button
                          type="button"
                          className="h-9 bg-primary px-4 text-sm font-medium text-primary-foreground"
                          style={{ borderRadius: radius }}
                        >
                          Primary
                        </button>
                        <button
                          type="button"
                          className="h-9 border border-border bg-background px-4 text-sm font-medium"
                          style={{ borderRadius: radius }}
                        >
                          Secondary
                        </button>
                      </div>
                      {activeSections.filter((s) => s.visible !== false).map((s) => (
                        <div key={s.id} className="overflow-hidden rounded-xl border border-border mb-3">
                          <SectionRenderer section={s} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionsEditor({
  sections,
  onChange,
}: {
  sections: SectionDef[];
  onChange: (next: SectionDef[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function addSection(type: SectionType) {
    onChange([...sections, createSection(type)]);
  }

  function remove(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function move(id: string, dir: "up" | "down") {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function patch(id: string, next: Partial<SectionDef>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...next } : s)));
  }

  function patchData(id: string, dataPatch: Record<string, unknown>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, data: { ...(s.data ?? {}), ...dataPatch } } : s)));
  }

  function patchStyle(id: string, stylePatch: Record<string, unknown>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, style: { ...(s.style ?? {}), ...stylePatch } } : s)));
  }

  function onDragEnd(e: DragEndEvent) {
    const active = e.active?.id as string | undefined;
    const over = e.over?.id as string | undefined;
    if (!active || !over || active === over) return;
    const oldIndex = sections.findIndex((s) => s.id === active);
    const newIndex = sections.findIndex((s) => s.id === over);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Sections</p>
          <p className="text-xs text-muted-foreground">Add, reorder, collapse, and edit each section’s content.</p>
        </div>
        <AddSectionButton onAdd={addSection} />
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No sections yet. Add one to start building this page.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <Accordion type="multiple" className="rounded-xl border border-border">
              {sections.map((s, idx) => (
                <SortableSectionItem
                  key={s.id}
                  section={s}
                  index={idx}
                  total={sections.length}
                  onRemove={() => remove(s.id)}
                  onMoveUp={() => move(s.id, "up")}
                  onMoveDown={() => move(s.id, "down")}
                  onRename={(name) => patch(s.id, { name })}
                  onToggleVisible={() => patch(s.id, { visible: s.visible === false ? true : false })}
                  onChangeType={(type) => patch(s.id, { type, data: createSection(type).data })}
                  onPatchData={(p) => patchData(s.id, p)}
                  onPatchStyle={(p) => patchStyle(s.id, p)}
                />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function AddSectionButton({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [type, setType] = useState<SectionType>("hero");
  return (
    <div className="flex items-center gap-2">
      <Select value={type} onValueChange={(v) => setType(v as SectionType)}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SECTION_LIBRARY.map((s) => (
            <SelectItem key={s.type} value={s.type}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" onClick={() => onAdd(type)}>
        <Plus className="mr-2 h-4 w-4" /> Add section
      </Button>
    </div>
  );
}

function SortableSectionItem({
  section,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRename,
  onToggleVisible,
  onChangeType,
  onPatchData,
  onPatchStyle,
}: {
  section: SectionDef;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename: (name: string) => void;
  onToggleVisible: () => void;
  onChangeType: (type: SectionType) => void;
  onPatchData: (patch: Record<string, unknown>) => void;
  onPatchStyle: (patch: Record<string, unknown>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <AccordionItem value={section.id} ref={setNodeRef} style={style} className={isDragging ? "bg-muted/30" : ""}>
      <div className="flex items-start gap-2 px-3">
        <button
          type="button"
          className="mt-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {section.name} <span className="ml-2 text-xs font-normal text-muted-foreground">({section.type})</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {section.visible === false ? "Hidden" : "Visible"} · Position {index + 1} of {total}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); onMoveUp(); }} disabled={index === 0} title="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); onMoveDown(); }} disabled={index === total - 1} title="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); onToggleVisible(); }} title={section.visible === false ? "Show section" : "Hide section"}>
                  <Eye className={`h-4 w-4 ${section.visible === false ? "opacity-40" : ""}`} />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); onRemove(); }} title="Delete section">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-1">
            <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Section title (internal)</Label>
                  <Input value={section.name} onChange={(e) => onRename(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Section type</Label>
                  <Select value={section.type} onValueChange={(v) => onChangeType(v as SectionType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTION_LIBRARY.map((s) => (
                        <SelectItem key={s.type} value={s.type}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SectionConfigForm section={section} onPatch={onPatchData} />

              <SectionStyleForm section={section} onPatch={onPatchStyle} />
            </div>
          </AccordionContent>
        </div>
      </div>
    </AccordionItem>
  );
}

function GlobalStylesEditor({ value, onChange }: { value: GlobalStylesShape; onChange: (v: GlobalStylesShape) => void }) {
  const fontOptions = ["Inter", "Cal Sans", "Playfair Display", "Poppins", "Montserrat"] as const;
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Primary color</Label>
          <ColorField value={value.primary_color} onChange={(c) => onChange({ ...value, primary_color: c })} />
        </div>
        <div className="space-y-2">
          <Label>Secondary color</Label>
          <ColorField value={value.secondary_color} onChange={(c) => onChange({ ...value, secondary_color: c })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Font family</Label>
          <Select value={value.font_family} onValueChange={(v) => onChange({ ...value, font_family: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {fontOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Button style</Label>
          <Select value={value.button_style} onValueChange={(v) => onChange({ ...value, button_style: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rounded">Rounded</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="pill">Pill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        These styles are saved into the template JSON and used when new sites are created from this template.
      </p>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
      />
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SectionStyleForm({ section, onPatch }: { section: SectionDef; onPatch: (patch: Record<string, unknown>) => void }) {
  const style = (section.style ?? {}) as any;
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">Style</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Alignment</Label>
          <Select value={style.align ?? "center"} onValueChange={(v) => onPatch({ align: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Padding Y (px)</Label>
          <Input
            type="number"
            value={style.paddingY ?? 80}
            onChange={(e) => onPatch({ paddingY: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Background</Label>
          <Input value={style.bg ?? ""} onChange={(e) => onPatch({ bg: e.target.value })} placeholder="CSS color or empty" />
        </div>
        <div className="space-y-2">
          <Label>Text color</Label>
          <Input value={style.fg ?? ""} onChange={(e) => onPatch({ fg: e.target.value })} placeholder="CSS color or empty" />
        </div>
      </div>
    </div>
  );
}

function SectionConfigForm({ section, onPatch }: { section: SectionDef; onPatch: (patch: Record<string, unknown>) => void }) {
  const d = (section.data ?? {}) as any;
  switch (section.type) {
    case "hero":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow">
              <Input value={d.eyebrow ?? ""} onChange={(e) => onPatch({ eyebrow: e.target.value })} />
            </Field>
            <Field label="Headline">
              <Input value={d.headline ?? ""} onChange={(e) => onPatch({ headline: e.target.value })} />
            </Field>
          </div>
          <Field label="Subheadline">
            <Textarea value={d.subheadline ?? ""} onChange={(e) => onPatch({ subheadline: e.target.value })} rows={3} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA text">
              <Input value={d.ctaPrimary ?? ""} onChange={(e) => onPatch({ ctaPrimary: e.target.value })} />
            </Field>
            <Field label="Primary CTA URL">
              <Input value={d.ctaPrimaryUrl ?? ""} onChange={(e) => onPatch({ ctaPrimaryUrl: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Secondary CTA text">
              <Input value={d.ctaSecondary ?? ""} onChange={(e) => onPatch({ ctaSecondary: e.target.value })} />
            </Field>
            <Field label="Secondary CTA URL">
              <Input value={d.ctaSecondaryUrl ?? ""} onChange={(e) => onPatch({ ctaSecondaryUrl: e.target.value })} />
            </Field>
          </div>
          <Field label="Background image">
            <ImageUploadField value={d.bgImage ?? ""} onChange={(url) => onPatch({ bgImage: url })} />
          </Field>
        </div>
      );
    case "about":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={d.body ?? ""} onChange={(e) => onPatch({ body: e.target.value })} rows={4} />
          </Field>
          <Field label="Image">
            <ImageUploadField value={d.image ?? ""} onChange={(url) => onPatch({ image: url })} />
          </Field>
        </div>
      );
    case "features":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
            </Field>
            <Field label="Columns">
              <Input type="number" value={d.columns ?? 3} onChange={(e) => onPatch({ columns: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Subtitle">
            <Input value={d.subtitle ?? ""} onChange={(e) => onPatch({ subtitle: e.target.value })} />
          </Field>
          <ArrayEditor
            title="Feature items"
            items={(d.items ?? []) as any[]}
            onChange={(items) => onPatch({ items })}
            newItem={() => ({ title: "New item", body: "", icon: "Check" })}
            renderItem={(it, setIt, remove) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <Input value={it.title ?? ""} onChange={(e) => setIt({ ...it, title: e.target.value })} />
                </Field>
                <Field label="Icon">
                  <Input value={it.icon ?? ""} onChange={(e) => setIt({ ...it, icon: e.target.value })} placeholder="e.g. Sparkles" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <Textarea value={it.body ?? ""} onChange={(e) => setIt({ ...it, body: e.target.value })} rows={3} />
                  </Field>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      );
    case "testimonials":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <ArrayEditor
            title="Testimonials"
            items={(d.items ?? []) as any[]}
            onChange={(items) => onPatch({ items })}
            newItem={() => ({ name: "Name", role: "Role", quote: "Quote", rating: 5 })}
            renderItem={(it, setIt, remove) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={it.name ?? ""} onChange={(e) => setIt({ ...it, name: e.target.value })} />
                </Field>
                <Field label="Role">
                  <Input value={it.role ?? ""} onChange={(e) => setIt({ ...it, role: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Quote">
                    <Textarea value={it.quote ?? ""} onChange={(e) => setIt({ ...it, quote: e.target.value })} rows={3} />
                  </Field>
                </div>
                <Field label="Rating (1-5)">
                  <Input type="number" value={it.rating ?? 5} onChange={(e) => setIt({ ...it, rating: Number(e.target.value) })} />
                </Field>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      );
    case "pricing":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <Input value={d.subtitle ?? ""} onChange={(e) => onPatch({ subtitle: e.target.value })} />
          </Field>
          <ArrayEditor
            title="Plans"
            items={(d.plans ?? []) as any[]}
            onChange={(plans) => onPatch({ plans })}
            newItem={() => ({ name: "Plan", price: "$0", period: "/mo", features: ["Feature 1"], cta: "Choose", highlight: false })}
            renderItem={(it, setIt, remove) => (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <Input value={it.name ?? ""} onChange={(e) => setIt({ ...it, name: e.target.value })} />
                  </Field>
                  <Field label="Price">
                    <Input value={it.price ?? ""} onChange={(e) => setIt({ ...it, price: e.target.value })} />
                  </Field>
                  <Field label="Period">
                    <Input value={it.period ?? ""} onChange={(e) => setIt({ ...it, period: e.target.value })} placeholder="/mo" />
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={!!it.highlight}
                      onChange={(e) => setIt({ ...it, highlight: e.target.checked })}
                    />
                    Highlight plan
                  </label>
                </div>
                <Field label="CTA text">
                  <Input value={it.cta ?? ""} onChange={(e) => setIt({ ...it, cta: e.target.value })} />
                </Field>
                <ArrayStringEditor
                  title="Features"
                  items={(it.features ?? []) as string[]}
                  onChange={(features) => setIt({ ...it, features })}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove plan
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      );
    case "team":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <ArrayEditor
            title="Members"
            items={(d.members ?? []) as any[]}
            onChange={(members) => onPatch({ members })}
            newItem={() => ({ name: "Name", role: "Role", image: "" })}
            renderItem={(it, setIt, remove) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={it.name ?? ""} onChange={(e) => setIt({ ...it, name: e.target.value })} />
                </Field>
                <Field label="Role">
                  <Input value={it.role ?? ""} onChange={(e) => setIt({ ...it, role: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Photo">
                    <ImageUploadField value={it.image ?? ""} onChange={(url) => setIt({ ...it, image: url })} />
                  </Field>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      );
    case "gallery":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
            </Field>
            <Field label="Columns">
              <Input type="number" value={d.columns ?? 3} onChange={(e) => onPatch({ columns: Number(e.target.value) })} />
            </Field>
          </div>
          <ArrayEditor
            title="Images"
            items={((d.images ?? []) as any[]).map((src) => ({ src }))}
            onChange={(items) => onPatch({ images: items.map((x) => x.src ?? "") })}
            newItem={() => ({ src: "" })}
            renderItem={(it, setIt, remove) => (
              <div className="grid gap-3">
                <Field label="Image">
                  <ImageUploadField value={it.src ?? ""} onChange={(url) => setIt({ ...it, src: url })} />
                </Field>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      );
    case "cta":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea value={d.body ?? ""} onChange={(e) => onPatch({ body: e.target.value })} rows={3} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA text">
              <Input value={d.cta ?? ""} onChange={(e) => onPatch({ cta: e.target.value })} />
            </Field>
            <Field label="CTA URL">
              <Input value={d.ctaUrl ?? ""} onChange={(e) => onPatch({ ctaUrl: e.target.value })} />
            </Field>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="grid gap-4">
          <Field label="Title">
            <Input value={d.title ?? ""} onChange={(e) => onPatch({ title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input value={d.email ?? ""} onChange={(e) => onPatch({ email: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={d.showForm !== false}
                onChange={(e) => onPatch({ showForm: e.target.checked })}
              />
              Show contact form
            </label>
          </div>
        </div>
      );
    case "footer":
      return (
        <div className="grid gap-4">
          <Field label="Brand">
            <Input value={d.brand ?? ""} onChange={(e) => onPatch({ brand: e.target.value })} />
          </Field>
          <Field label="Copyright">
            <Input value={d.copyright ?? ""} onChange={(e) => onPatch({ copyright: e.target.value })} />
          </Field>
          <ArrayStringEditor
            title="Links"
            items={(d.links ?? []) as string[]}
            onChange={(links) => onPatch({ links })}
          />
        </div>
      );
    default:
      return (
        <div className="rounded-lg border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
          This section type doesn’t have a dedicated editor yet. (Type: {section.type})
        </div>
      );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ArrayEditor<T>({
  title,
  items,
  onChange,
  newItem,
  renderItem,
}: {
  title: string;
  items: T[];
  onChange: (next: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, setItem: (next: T) => void, remove: () => void) => React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...(items ?? []), newItem()])}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
        {(items ?? []).map((it, idx) => (
          <div key={idx} className="rounded-lg border border-border p-3">
            {renderItem(
              it,
              (next) => onChange(items.map((x, i) => (i === idx ? next : x))),
              () => onChange(items.filter((_, i) => i !== idx)),
            )}
          </div>
        ))}
        {(items ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No items yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function ArrayStringEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...(items ?? []), ""])}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="mt-3 grid gap-2">
        {(items ?? []).map((v, idx) => (
          <div key={idx} className="flex gap-2">
            <Input value={v} onChange={(e) => onChange(items.map((x, i) => (i === idx ? e.target.value : x)))} />
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => onChange(items.filter((_, i) => i !== idx))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(items ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No items yet.</p> : null}
      </div>
    </div>
  );
}

function ImageUploadField({
  value,
  onChange,
  placeholder = "https://...",
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const result = await uploadImage(file);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {busy ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value ? (
        <div className="overflow-hidden rounded-md border border-border bg-muted/40">
          <img src={value} alt="Preview" className="max-h-40 w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}

import { useActiveSections, useEditor } from "@/stores/editor-store";
import type { SectionDef } from "@/data/sections";
import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Settings2, Palette, ImageIcon } from "lucide-react";
import { MediaLibraryModal } from "@/components/media/media-library-modal";

const THEME_PRESETS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#ef4444", "#8b5cf6"];

export function PropertiesPanel() {
  const {
    selectedId, siteName, setSiteName, updateSectionData, updateSectionStyle, renameSection,
    themeColor, setThemeColor,
  } = useEditor();
  const sections = useActiveSections();
  const selected = sections.find((s) => s.id === selectedId) ?? null;
  const [tab, setTab] = useState<"content" | "style">("content");

  if (!selected) {
    return (
      <div className="space-y-5 p-5">
        <header>
          <h3 className="text-sm font-semibold">Site settings</h3>
          <p className="text-xs text-muted-foreground">Click a section on the canvas to edit its properties.</p>
        </header>
        <Field label="Site name">
          <TextInput value={siteName} onChange={setSiteName} />
        </Field>
        <Field label="Theme color">
          <div className="flex flex-wrap items-center gap-2">
            {THEME_PRESETS.map((c) => {
              const active = c.toLowerCase() === (themeColor ?? "").toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThemeColor(c)}
                  className={`h-8 w-8 rounded-full border transition ${active ? "ring-2 ring-offset-2 ring-foreground border-transparent" : "border-border hover:scale-110"}`}
                  style={{ background: c }}
                  aria-label={c}
                  aria-pressed={active}
                />
              );
            })}
            <input
              type="color"
              value={themeColor || "#6366f1"}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded-md border border-input bg-background"
              aria-label="Custom color"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Used as the accent color across hero gradients and CTA buttons.
          </p>
        </Field>
        <Field label="Heading font">
          <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option>Inter</option><option>Cal Sans</option><option>Playfair Display</option>
          </select>
        </Field>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-sidebar-border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Editing section</p>
        <input
          value={selected.name}
          onChange={(e) => renameSection(selected.id, e.target.value)}
          className="-mx-1 mt-0.5 w-full rounded px-1 text-sm font-semibold outline-none hover:bg-muted focus:bg-background focus:ring-1 focus:ring-ring"
        />
      </header>
      <div className="flex border-b border-sidebar-border">
        <PanelTab active={tab === "content"} onClick={() => setTab("content")} icon={Settings2}>Content</PanelTab>
        <PanelTab active={tab === "style"} onClick={() => setTab("style")} icon={Palette}>Style</PanelTab>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tab === "content" ? (
          <SectionEditor section={selected} onChange={(patch) => updateSectionData(selected.id, patch)} />
        ) : (
          <StyleEditor section={selected} onChange={(patch) => updateSectionStyle(selected.id, patch)} />
        )}
      </div>
    </div>
  );
}

function PanelTab({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
    />
  );
}

function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value ?? ""}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background p-3 text-sm"
    />
  );
}

function NumberInput({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
    />
  );
}

function ImageUpload({ value, onChange, placeholder = "https://..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Choose from Library
        </button>
      </div>
      {value && (
        <div className="overflow-hidden rounded-md border border-border bg-muted/40">
          <img src={value} alt="Preview" className="max-h-32 w-full object-cover" />
        </div>
      )}
      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(asset) => onChange(asset.file_url)}
      />
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background"
      />
      <input
        value={value ?? ""}
        placeholder="auto"
        onChange={(e) => onChange(e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
      />
      {value && (
        <button onClick={() => onChange("")} className="h-9 rounded-md border border-input px-2 text-xs text-muted-foreground hover:bg-muted">
          Clear
        </button>
      )}
    </div>
  );
}

function ButtonGroup<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md border border-input p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded px-2 py-1.5 text-xs font-medium ${value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ============== STYLE EDITOR ============== */

function StyleEditor({ section, onChange }: { section: SectionDef; onChange: (patch: Record<string, unknown>) => void }) {
  const s = section.style ?? {};
  return (
    <>
      <Field label="Background color">
        <ColorInput value={s.bg ?? ""} onChange={(v) => onChange({ bg: v })} />
      </Field>
      <Field label="Text color">
        <ColorInput value={s.fg ?? ""} onChange={(v) => onChange({ fg: v })} />
      </Field>
      <Field label={`Vertical padding (${s.paddingY ?? 80}px)`}>
        <input
          type="range"
          min={0}
          max={200}
          value={s.paddingY ?? 80}
          onChange={(e) => onChange({ paddingY: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <Field label="Alignment">
        <ButtonGroup
          value={s.align ?? "center"}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          onChange={(v) => onChange({ align: v })}
        />
      </Field>
      <Field label="Width">
        <ButtonGroup
          value={s.width ?? "boxed"}
          options={[
            { value: "boxed", label: "Boxed" },
            { value: "full", label: "Full" },
          ]}
          onChange={(v) => onChange({ width: v })}
        />
      </Field>
    </>
  );
}

/* ============== LIST HELPERS ============== */

function ItemCard({
  title, index, total, onMoveUp, onMoveDown, onRemove, children,
}: {
  title: string; index: number; total: number;
  onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <button onClick={() => setOpen(!open)} className="flex-1 truncate text-left text-xs font-medium">
          {title || `Item ${index + 1}`}
        </button>
        <IconBtn onClick={onMoveUp} disabled={index === 0}><ChevronUp className="h-3 w-3" /></IconBtn>
        <IconBtn onClick={onMoveDown} disabled={index === total - 1}><ChevronDown className="h-3 w-3" /></IconBtn>
        <IconBtn onClick={onRemove} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></IconBtn>
      </div>
      {open && <div className="space-y-3 p-3">{children}</div>}
    </div>
  );
}

function IconBtn({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 ${className}`}
    />
  );
}

function AddItemBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-muted/50 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function moveItem<T>(arr: T[], i: number, dir: "up" | "down"): T[] {
  const t = dir === "up" ? i - 1 : i + 1;
  if (t < 0 || t >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[t]] = [next[t], next[i]];
  return next;
}

/* ============== SECTION EDITOR ============== */

function SectionEditor({ section, onChange }: { section: SectionDef; onChange: (patch: Record<string, unknown>) => void }) {
  const d = section.data as any;

  const updateList = <T,>(key: string, items: T[]) => onChange({ [key]: items });

  switch (section.type) {
    case "hero":
      return (
        <>
          <Field label="Eyebrow"><TextInput value={d.eyebrow} onChange={(v) => onChange({ eyebrow: v })} /></Field>
          <Field label="Headline"><TextInput value={d.headline} onChange={(v) => onChange({ headline: v })} /></Field>
          <Field label="Subheadline"><TextArea value={d.subheadline} onChange={(v) => onChange({ subheadline: v })} /></Field>
          <Field label="Primary button text"><TextInput value={d.ctaPrimary} onChange={(v) => onChange({ ctaPrimary: v })} /></Field>
          <Field label="Primary button URL"><TextInput value={d.ctaPrimaryUrl} onChange={(v) => onChange({ ctaPrimaryUrl: v })} placeholder="https://..." /></Field>
          <Field label="Secondary button text"><TextInput value={d.ctaSecondary} onChange={(v) => onChange({ ctaSecondary: v })} /></Field>
          <Field label="Secondary button URL"><TextInput value={d.ctaSecondaryUrl} onChange={(v) => onChange({ ctaSecondaryUrl: v })} placeholder="https://..." /></Field>
          <Field label="Background image"><ImageUpload value={d.bgImage} onChange={(v) => onChange({ bgImage: v })} /></Field>
        </>
      );

    case "about":
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Body"><TextArea value={d.body} onChange={(v) => onChange({ body: v })} rows={5} /></Field>
          <Field label="Image"><ImageUpload value={d.image} onChange={(v) => onChange({ image: v })} /></Field>
        </>
      );

    case "features": {
      const items: any[] = d.items ?? [];
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Subtitle"><TextInput value={d.subtitle} onChange={(v) => onChange({ subtitle: v })} /></Field>
          <Field label="Columns">
            <ButtonGroup
              value={String(d.columns ?? 3) as any}
              options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]}
              onChange={(v) => onChange({ columns: Number(v) })}
            />
          </Field>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Features</p>
            {items.map((it, i) => (
              <ItemCard
                key={i} title={it.title} index={i} total={items.length}
                onMoveUp={() => updateList("items", moveItem(items, i, "up"))}
                onMoveDown={() => updateList("items", moveItem(items, i, "down"))}
                onRemove={() => updateList("items", items.filter((_, k) => k !== i))}
              >
                <Field label="Icon">
                  <select
                    value={it.icon ?? "Check"}
                    onChange={(e) => updateList("items", items.map((x, k) => k === i ? { ...x, icon: e.target.value } : x))}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {["Check", "Sparkles", "Globe", "Zap", "Shield", "Heart", "Rocket", "Star"].map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Title"><TextInput value={it.title} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, title: v } : x))} /></Field>
                <Field label="Body"><TextArea value={it.body} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, body: v } : x))} /></Field>
              </ItemCard>
            ))}
            <AddItemBtn label="Add feature" onClick={() => updateList("items", [...items, { title: "New feature", body: "Describe it.", icon: "Check" }])} />
          </div>
        </>
      );
    }

    case "testimonials": {
      const items: any[] = d.items ?? [];
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Testimonials</p>
            {items.map((it, i) => (
              <ItemCard
                key={i} title={it.name} index={i} total={items.length}
                onMoveUp={() => updateList("items", moveItem(items, i, "up"))}
                onMoveDown={() => updateList("items", moveItem(items, i, "down"))}
                onRemove={() => updateList("items", items.filter((_, k) => k !== i))}
              >
                <Field label="Name"><TextInput value={it.name} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, name: v } : x))} /></Field>
                <Field label="Role"><TextInput value={it.role} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, role: v } : x))} /></Field>
                <Field label="Quote"><TextArea value={it.quote} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, quote: v } : x))} /></Field>
                <Field label="Rating (1-5)">
                  <NumberInput value={it.rating ?? 5} min={1} max={5} onChange={(v) => updateList("items", items.map((x, k) => k === i ? { ...x, rating: v } : x))} />
                </Field>
              </ItemCard>
            ))}
            <AddItemBtn label="Add testimonial" onClick={() => updateList("items", [...items, { name: "New person", role: "Title, Company", quote: "Great product!", rating: 5 }])} />
          </div>
        </>
      );
    }

    case "pricing": {
      const plans: any[] = d.plans ?? [];
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Subtitle"><TextInput value={d.subtitle} onChange={(v) => onChange({ subtitle: v })} /></Field>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Plans</p>
            {plans.map((p, i) => (
              <ItemCard
                key={i} title={p.name} index={i} total={plans.length}
                onMoveUp={() => updateList("plans", moveItem(plans, i, "up"))}
                onMoveDown={() => updateList("plans", moveItem(plans, i, "down"))}
                onRemove={() => updateList("plans", plans.filter((_, k) => k !== i))}
              >
                <Field label="Plan name"><TextInput value={p.name} onChange={(v) => updateList("plans", plans.map((x, k) => k === i ? { ...x, name: v } : x))} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Price"><TextInput value={p.price} onChange={(v) => updateList("plans", plans.map((x, k) => k === i ? { ...x, price: v } : x))} /></Field>
                  <Field label="Period"><TextInput value={p.period} onChange={(v) => updateList("plans", plans.map((x, k) => k === i ? { ...x, period: v } : x))} /></Field>
                </div>
                <Field label="CTA button text"><TextInput value={p.cta} onChange={(v) => updateList("plans", plans.map((x, k) => k === i ? { ...x, cta: v } : x))} /></Field>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!p.highlight}
                    onChange={(e) => updateList("plans", plans.map((x, k) => k === i ? { ...x, highlight: e.target.checked } : x))}
                  />
                  Highlight as "Most popular"
                </label>
                <Field label="Features (one per line)">
                  <TextArea
                    value={(p.features ?? []).join("\n")}
                    rows={4}
                    onChange={(v) => updateList("plans", plans.map((x, k) => k === i ? { ...x, features: v.split("\n").filter(Boolean) } : x))}
                  />
                </Field>
              </ItemCard>
            ))}
            <AddItemBtn label="Add plan" onClick={() => updateList("plans", [...plans, { name: "New plan", price: "$0", period: "/mo", features: ["Feature 1"], cta: "Get started", highlight: false }])} />
          </div>
        </>
      );
    }

    case "team": {
      const members: any[] = d.members ?? [];
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Team members</p>
            {members.map((m, i) => (
              <ItemCard
                key={i} title={m.name} index={i} total={members.length}
                onMoveUp={() => updateList("members", moveItem(members, i, "up"))}
                onMoveDown={() => updateList("members", moveItem(members, i, "down"))}
                onRemove={() => updateList("members", members.filter((_, k) => k !== i))}
              >
                <Field label="Name"><TextInput value={m.name} onChange={(v) => updateList("members", members.map((x, k) => k === i ? { ...x, name: v } : x))} /></Field>
                <Field label="Role"><TextInput value={m.role} onChange={(v) => updateList("members", members.map((x, k) => k === i ? { ...x, role: v } : x))} /></Field>
                <Field label="Photo"><ImageUpload value={m.image} onChange={(v) => updateList("members", members.map((x, k) => k === i ? { ...x, image: v } : x))} /></Field>
              </ItemCard>
            ))}
            <AddItemBtn label="Add member" onClick={() => updateList("members", [...members, { name: "New person", role: "Role", image: "" }])} />
          </div>
        </>
      );
    }

    case "gallery": {
      const images: string[] = d.images ?? [];
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Columns">
            <ButtonGroup
              value={String(d.columns ?? 3) as any}
              options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]}
              onChange={(v) => onChange({ columns: Number(v) })}
            />
          </Field>
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Images</p>
            {images.map((src, i) => (
              <div key={i} className="space-y-2 rounded-md border border-border bg-background p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Image {i + 1}</span>
                  <IconBtn onClick={() => onChange({ images: images.filter((_, k) => k !== i) })} className="hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
                <ImageUpload value={src} onChange={(v) => onChange({ images: images.map((x, k) => k === i ? v : x) })} />
              </div>
            ))}
            <AddItemBtn label="Add image" onClick={() => onChange({ images: [...images, ""] })} />
          </div>
        </>
      );
    }

    case "cta":
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Body"><TextArea value={d.body} onChange={(v) => onChange({ body: v })} /></Field>
          <Field label="Button text"><TextInput value={d.cta} onChange={(v) => onChange({ cta: v })} /></Field>
          <Field label="Button URL"><TextInput value={d.ctaUrl} onChange={(v) => onChange({ ctaUrl: v })} placeholder="https://..." /></Field>
        </>
      );

    case "contact":
      return (
        <>
          <Field label="Title"><TextInput value={d.title} onChange={(v) => onChange({ title: v })} /></Field>
          <Field label="Contact email"><TextInput value={d.email} onChange={(v) => onChange({ email: v })} /></Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={d.showForm !== false} onChange={(e) => onChange({ showForm: e.target.checked })} />
            Show contact form
          </label>
        </>
      );

    case "footer": {
      const links: string[] = d.links ?? [];
      return (
        <>
          <Field label="Brand"><TextInput value={d.brand} onChange={(v) => onChange({ brand: v })} /></Field>
          <Field label="Copyright"><TextInput value={d.copyright} onChange={(v) => onChange({ copyright: v })} /></Field>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground">Footer links</p>
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <TextInput value={l} onChange={(v) => onChange({ links: links.map((x, k) => k === i ? v : x) })} />
                <IconBtn onClick={() => onChange({ links: links.filter((_, k) => k !== i) })} className="h-9 w-9 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            ))}
            <AddItemBtn label="Add link" onClick={() => onChange({ links: [...links, "New link"] })} />
          </div>
        </>
      );
    }
  }
}

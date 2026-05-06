import { Star } from "lucide-react";
import type { Template } from "@/data/templates";

/**
 * Lightweight visual "screenshot" of a template — pure CSS so each
 * template feels distinct without needing real image assets.
 */
export function TemplatePreview({ template, compact = false }: { template: Template; compact?: boolean }) {
  const accent = template.accent;
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)` }}
    >
      {/* Faux browser chrome */}
      <div className="flex h-6 items-center gap-1.5 border-b border-border/40 bg-background/60 px-2">
        <span className="h-2 w-2 rounded-full bg-red-400/60" />
        <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
        <span className="h-2 w-2 rounded-full bg-green-400/60" />
      </div>
      {/* Faux nav */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: accent }} />
          <div className="h-2 w-10 rounded-sm bg-foreground/30" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-1.5 w-6 rounded-sm bg-foreground/15" />)}
        </div>
      </div>
      {/* Hero */}
      <div className="px-4 pt-3">
        <div className="space-y-1.5">
          <div className="h-1.5 w-12 rounded-full" style={{ background: `${accent}60` }} />
          <div className="h-2.5 w-[80%] rounded-md bg-foreground/70" />
          <div className="h-2.5 w-[55%] rounded-md bg-foreground/70" />
          <div className="h-1.5 w-[70%] rounded-sm bg-foreground/25" />
          <div className="h-1.5 w-[60%] rounded-sm bg-foreground/25" />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <div className="h-3 w-12 rounded" style={{ background: accent }} />
          <div className="h-3 w-10 rounded border border-foreground/30" />
        </div>
      </div>
      {/* Cards row */}
      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border/50 bg-background/70 p-1.5">
              <div className="h-1.5 w-1.5 rounded-sm" style={{ background: accent }} />
              <div className="mt-1 h-1.5 w-full rounded-sm bg-foreground/40" />
              <div className="mt-1 h-1 w-3/4 rounded-sm bg-foreground/20" />
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-2 left-3 text-[10px] font-medium" style={{ color: accent }}>
        {template.tagline}
      </div>
    </div>
  );
}

export function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-500" />
      <span className="font-medium text-foreground">{value.toFixed(1)}</span>
    </span>
  );
}

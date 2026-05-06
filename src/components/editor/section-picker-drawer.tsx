import { X } from "lucide-react";
import { SECTION_LIBRARY, type SectionType } from "@/data/sections";
import { useEditor } from "@/stores/editor-store";

export function SectionPickerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addSection } = useEditor();

  if (!open) return null;

  // group by category
  const grouped = SECTION_LIBRARY.reduce<Record<string, typeof SECTION_LIBRARY>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  const handleAdd = (type: SectionType) => {
    addSection(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <aside className="flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">Add a section</h3>
            <p className="text-xs text-muted-foreground">Choose a section type to insert into your page.</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {items.map((it) => (
                  <button
                    key={it.type}
                    onClick={() => handleAdd(it.type)}
                    className="group rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-2 aspect-[4/2] rounded-md bg-gradient-card" />
                    <p className="text-sm font-medium">{it.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{it.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

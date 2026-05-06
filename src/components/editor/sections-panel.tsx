import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Copy, Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useActiveSections, useEditor } from "@/stores/editor-store";
import type { SectionDef } from "@/data/sections";

export function SectionsPanel({ onAdd }: { onAdd: () => void }) {
  const { reorder, selectedId, select } = useEditor();
  const sections = useActiveSections();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const next = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    reorder(next);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {sections.length} sections
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((s) => (
              <SectionRow key={s.id} section={s} selected={selectedId === s.id} onSelect={() => select(s.id)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onAdd}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>
    </div>
  );
}

function SectionRow({ section, selected, onSelect }: { section: SectionDef; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const { toggleVisibility, duplicateSection, removeSection } = useEditor();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group mb-1 flex items-center gap-1 rounded-md border px-1.5 py-1.5 text-sm transition ${
        selected
          ? "border-primary/40 bg-sidebar-accent text-sidebar-accent-foreground"
          : "border-transparent hover:bg-sidebar-accent/60"
      } ${section.visible ? "" : "opacity-60"}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Drag"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate">{section.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id); }}
        className="rounded p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label="Toggle visibility"
      >
        {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}
        className="rounded p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label="Duplicate"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
        className="rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

import { create } from "zustand";
import { defaultPageSections, createSection, type SectionDef, type SectionType } from "@/data/sections";

export type PageSlug = "home" | "about" | "services" | "contact" | string;

export interface EditorPage {
  id: string | null;
  name: string;
  slug: PageSlug;
  order: number;
  is_homepage: boolean;
  sections: SectionDef[];
  /** Per-page dirty flag — only the dirty page(s) are pushed on save. */
  dirty: boolean;
}

interface EditorState {
  siteName: string;
  /** All pages on the site. The currently-edited page is `pages[activeIndex]`. */
  pages: EditorPage[];
  activeSlug: PageSlug;
  selectedId: string | null;
  device: "desktop" | "tablet" | "mobile";
  history: SectionDef[][];
  future: SectionDef[][];
  /** Backend site id when editing a persisted project. Null for template previews. */
  siteId: string | null;
  /** True once we've loaded the initial state (template or backend). */
  loaded: boolean;
  /** Site-wide theme color, written into the canvas as --site-primary so the
   *  renderer's gradient/CTA accents respect it. */
  themeColor: string;
  /** True when site-level metadata (theme, name) needs persisting. */
  metaDirty: boolean;

  // Convenience derived getters (kept for the existing consumers)
  // (returned via selectors below)

  setSiteName: (name: string) => void;
  setThemeColor: (color: string) => void;
  setDevice: (d: "desktop" | "tablet" | "mobile") => void;
  select: (id: string | null) => void;
  switchPage: (slug: PageSlug) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  toggleVisibility: (id: string) => void;
  reorder: (ids: string[]) => void;
  moveSection: (id: string, dir: "up" | "down") => void;
  updateSectionData: (id: string, patch: Record<string, unknown>) => void;
  updateSectionStyle: (id: string, patch: Record<string, unknown>) => void;
  renameSection: (id: string, name: string) => void;
  undo: () => void;
  redo: () => void;
  loadTemplate: (templateId: string) => void;
  hydrateFromBackend: (args: {
    siteId: string;
    name: string;
    themeColor?: string;
    pages: Array<{
      id: string;
      name: string;
      slug: string;
      order: number;
      is_homepage: boolean;
      sections: SectionDef[];
    }>;
  }) => void;
  /** Mark a single page (or the active page if omitted) as saved. */
  markPageClean: (slug?: PageSlug) => void;
  /** Mark site-level meta (name + theme) as saved. */
  markMetaClean: () => void;
}

const snap = (s: SectionDef[]) => JSON.parse(JSON.stringify(s)) as SectionDef[];

const DEFAULT_PAGE_DEFS: { name: string; slug: PageSlug; is_homepage: boolean }[] = [
  { name: "Home", slug: "home", is_homepage: true },
  { name: "About", slug: "about", is_homepage: false },
  { name: "Services", slug: "services", is_homepage: false },
  { name: "Contact", slug: "contact", is_homepage: false },
];

function buildLocalPages(): EditorPage[] {
  return DEFAULT_PAGE_DEFS.map((p, i) => ({
    id: null,
    name: p.name,
    slug: p.slug,
    order: i,
    is_homepage: p.is_homepage,
    sections: defaultPageSections(p.slug),
    dirty: false,
  }));
}

/** Update the currently-active page's sections and bump per-page history. */
function withActivePageUpdate(
  state: EditorState,
  mutate: (sections: SectionDef[]) => SectionDef[],
): Partial<EditorState> {
  const idx = state.pages.findIndex((p) => p.slug === state.activeSlug);
  if (idx < 0) return {};
  const current = state.pages[idx];
  const nextSections = mutate(current.sections);
  const nextPages = [...state.pages];
  nextPages[idx] = { ...current, sections: nextSections, dirty: true };
  return {
    pages: nextPages,
    history: [...state.history, snap(current.sections)],
    future: [],
  };
}

export const useEditor = create<EditorState>((set) => ({
  siteName: "My new site",
  pages: buildLocalPages(),
  activeSlug: "home",
  selectedId: null,
  device: "desktop",
  history: [],
  future: [],
  siteId: null,
  loaded: false,
  themeColor: "#6366f1",
  metaDirty: false,

  setSiteName: (name) => set({ siteName: name, metaDirty: true }),
  setThemeColor: (color) => set({ themeColor: color, metaDirty: true }),
  setDevice: (device) => set({ device }),
  select: (selectedId) => set({ selectedId }),

  switchPage: (slug) =>
    set((state) => {
      if (state.activeSlug === slug) return state;
      // History/future are per-active-page edits — clear when switching.
      return { activeSlug: slug, selectedId: null, history: [], future: [] };
    }),

  addSection: (type) =>
    set((state) => withActivePageUpdate(state, (sections) => [...sections, createSection(type)])),

  removeSection: (id) =>
    set((state) => {
      const update = withActivePageUpdate(state, (sections) => sections.filter((s) => s.id !== id));
      return { ...update, selectedId: state.selectedId === id ? null : state.selectedId };
    }),

  duplicateSection: (id) =>
    set((state) =>
      withActivePageUpdate(state, (sections) => {
        const idx = sections.findIndex((s) => s.id === id);
        if (idx < 0) return sections;
        const orig = sections[idx];
        const copy: SectionDef = {
          ...orig,
          id: `${orig.id}_${Date.now().toString(36)}`,
          data: JSON.parse(JSON.stringify(orig.data)),
        };
        return [...sections.slice(0, idx + 1), copy, ...sections.slice(idx + 1)];
      }),
    ),

  toggleVisibility: (id) =>
    set((state) =>
      withActivePageUpdate(state, (sections) =>
        sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
      ),
    ),

  reorder: (ids) =>
    set((state) =>
      withActivePageUpdate(state, (sections) => {
        const map = new Map(sections.map((s) => [s.id, s]));
        return ids.map((id) => map.get(id)).filter(Boolean) as SectionDef[];
      }),
    ),

  moveSection: (id, dir) =>
    set((state) =>
      withActivePageUpdate(state, (sections) => {
        const idx = sections.findIndex((s) => s.id === id);
        if (idx < 0) return sections;
        const target = dir === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= sections.length) return sections;
        const next = [...sections];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      }),
    ),

  updateSectionData: (id, patch) =>
    set((state) =>
      withActivePageUpdate(state, (sections) =>
        sections.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...patch } } : s)),
      ),
    ),

  updateSectionStyle: (id, patch) =>
    set((state) =>
      withActivePageUpdate(state, (sections) =>
        sections.map((s) => (s.id === id ? { ...s, style: { ...(s.style ?? {}), ...patch } } : s)),
      ),
    ),

  renameSection: (id, name) =>
    set((state) =>
      withActivePageUpdate(state, (sections) =>
        sections.map((s) => (s.id === id ? { ...s, name } : s)),
      ),
    ),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const idx = state.pages.findIndex((p) => p.slug === state.activeSlug);
      if (idx < 0) return state;
      const prev = state.history[state.history.length - 1];
      const nextPages = [...state.pages];
      nextPages[idx] = { ...nextPages[idx], sections: prev, dirty: true };
      return {
        pages: nextPages,
        history: state.history.slice(0, -1),
        future: [snap(state.pages[idx].sections), ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const idx = state.pages.findIndex((p) => p.slug === state.activeSlug);
      if (idx < 0) return state;
      const [next, ...rest] = state.future;
      const nextPages = [...state.pages];
      nextPages[idx] = { ...nextPages[idx], sections: next, dirty: true };
      return {
        pages: nextPages,
        future: rest,
        history: [...state.history, snap(state.pages[idx].sections)],
      };
    }),

  loadTemplate: (templateId) => {
    set({
      siteName: `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} site`,
      pages: buildLocalPages(),
      activeSlug: "home",
      selectedId: null,
      history: [],
      future: [],
      siteId: null,
      loaded: true,
      themeColor: "#6366f1",
      metaDirty: false,
    });
  },

  hydrateFromBackend: ({ siteId, name, pages, themeColor }) => {
    const sortedPages = [...pages].sort((a, b) => a.order - b.order);
    const editorPages: EditorPage[] = sortedPages.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      order: p.order,
      is_homepage: p.is_homepage,
      sections: (p.sections && p.sections.length > 0
        ? p.sections
        : defaultPageSections(p.slug)) as SectionDef[],
      dirty: false,
    }));
    const home = editorPages.find((p) => p.is_homepage) ?? editorPages[0];
    set({
      siteName: name,
      pages: editorPages.length > 0 ? editorPages : buildLocalPages(),
      activeSlug: (home?.slug ?? "home") as PageSlug,
      selectedId: null,
      history: [],
      future: [],
      siteId,
      loaded: true,
      themeColor: themeColor || "#6366f1",
      metaDirty: false,
    });
  },

  markPageClean: (slug) =>
    set((state) => {
      const target = slug ?? state.activeSlug;
      return {
        pages: state.pages.map((p) => (p.slug === target ? { ...p, dirty: false } : p)),
      };
    }),

  markMetaClean: () => set({ metaDirty: false }),
}));

/** Convenience selector — sections of the currently-active page. */
export function useActiveSections(): SectionDef[] {
  return useEditor((s) => s.pages.find((p) => p.slug === s.activeSlug)?.sections ?? []);
}

/** True if any page on the site has unsaved changes. */
export function useAnyDirty(): boolean {
  return useEditor((s) => s.pages.some((p) => p.dirty));
}

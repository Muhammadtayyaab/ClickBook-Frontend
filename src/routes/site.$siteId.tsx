import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SectionRenderer } from "@/components/section-renderer";
import type { SectionDef } from "@/data/sections";
import { getPublicSite, type PublicSitePage, type PublicSitePayload } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { Skeleton } from "@/components/ui/skeleton";
import { themeStyleVars } from "@/lib/theme";

interface SiteSearch {
  page?: string;
}

export const Route = createFileRoute("/site/$siteId")({
  head: () => ({
    meta: [{ title: `Live site — ${APP_NAME}` }],
  }),
  validateSearch: (search: Record<string, unknown>): SiteSearch => ({
    page: typeof search.page === "string" ? search.page : undefined,
  }),
  component: HostedSite,
});

function HostedSite() {
  const { siteId } = useParams({ from: "/site/$siteId" });
  const { page: pageParam } = useSearch({ from: "/site/$siteId" });
  const [data, setData] = useState<PublicSitePayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(pageParam ?? null);

  useEffect(() => {
    setNotFound(false);
    getPublicSite(siteId, pageParam)
      .then((d) => {
        setData(d);
        setActiveSlug(d.current_page ?? null);
        document.title = d.meta_title || d.name;
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setNotFound(true);
      });
  }, [siteId, pageParam]);

  const activePage: PublicSitePage | null = useMemo(() => {
    if (!data) return null;
    if (activeSlug) {
      const match = data.pages.find((p) => p.slug === activeSlug);
      if (match) return match;
    }
    return data.pages.find((p) => p.is_homepage) ?? data.pages[0] ?? null;
  }, [data, activeSlug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-6xl font-bold">404</h1>
          <h2 className="mt-3 text-xl font-semibold">Site not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This site either doesn't exist or hasn't been published yet.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  const sections = ((activePage?.sections ?? data.sections) as unknown) as SectionDef[];
  const themePrimary = ((data.global_styles ?? {}) as { colors?: { primary?: string } }).colors?.primary;

  return (
    <div className="min-h-screen bg-background" style={themeStyleVars(themePrimary)}>
      <SiteNavbar
        siteName={data.name}
        pages={data.pages}
        activeSlug={activePage?.slug ?? null}
        onSelect={(slug) => {
          setActiveSlug(slug);
          // Update the URL without a hard reload so deep links work.
          const next = new URL(window.location.href);
          if (slug && slug !== "home") next.searchParams.set("page", slug);
          else next.searchParams.delete("page");
          window.history.replaceState({}, "", next.toString());
        }}
      />
      {sections.length === 0 ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">This page is empty.</p>
        </div>
      ) : (
        sections
          .filter((s) => s.visible !== false)
          .map((s) => <SectionRenderer key={s.id} section={s} siteId={siteId} />)
      )}
      <div className="border-t border-border bg-muted/30 py-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link to="/" className="font-medium text-foreground hover:underline">
          {APP_NAME}
        </Link>
      </div>
    </div>
  );
}

function SiteNavbar({
  siteName,
  pages,
  activeSlug,
  onSelect,
}: {
  siteName: string;
  pages: PublicSitePage[];
  activeSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  if (!pages || pages.length <= 1) return null;
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
      <button
        onClick={() => {
          const home = pages.find((p) => p.is_homepage) ?? pages[0];
          if (home) onSelect(home.slug);
        }}
        className="text-sm font-semibold tracking-tight"
      >
        {siteName}
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => onSelect(p.slug)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeSlug === p.slug
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </nav>
  );
}

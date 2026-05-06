import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  type AdminMediaAsset,
  deleteMedia,
  formatFileSize,
  listAllMedia,
} from "@/lib/media-api";
import { ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [{ title: `Admin Media — ${APP_NAME}` }],
  }),
  component: AdminMediaPage,
});

const PER_PAGE = 30;

function AdminMediaPage() {
  const [items, setItems] = useState<AdminMediaAsset[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await listAllMedia({ page: nextPage, per_page: PER_PAGE });
      setTotal(res.total);
      setPage(res.page);
      setItems((prev) => (append && prev ? [...prev, ...res.items] : res.items));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const haystack = [
        a.original_name ?? a.file_name,
        a.user_name ?? "",
        a.user_email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const totalSize = useMemo(
    () => (items ?? []).reduce((sum, a) => sum + (a.size ?? 0), 0),
    [items],
  );

  async function handleDelete(asset: AdminMediaAsset) {
    const owner = asset.user_email ?? asset.user_name ?? "this user";
    if (
      !confirm(
        `Delete "${asset.original_name ?? asset.file_name}" owned by ${owner}? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(asset.id);
    try {
      await deleteMedia(asset.id);
      setItems((prev) => (prev ? prev.filter((a) => a.id !== asset.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const hasMore = items ? items.length < total : false;
  const showSkeleton = items === null;
  const showEmpty = items !== null && items.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">All Media</h1>
            <p className="text-sm text-muted-foreground">
              Every asset uploaded by every user. Use this to clean up policy violations or recover space.
            </p>
          </div>
          <div className="hidden flex-col items-end text-right text-xs text-muted-foreground sm:flex">
            <span>{total} total assets</span>
            {items && items.length > 0 && (
              <span>{formatFileSize(totalSize)} loaded</span>
            )}
          </div>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, owner name, or email…"
          className="pl-9"
        />
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-medium">No assets across the platform</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Once any user uploads an image, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(filtered ?? []).map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-md"
              >
                <a
                  href={asset.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square w-full overflow-hidden bg-muted/40"
                  title="Open full size"
                >
                  <img
                    src={asset.file_url}
                    alt={asset.original_name ?? asset.file_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
                <div className="space-y-2 border-t border-border p-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium" title={asset.original_name ?? asset.file_name}>
                      {asset.original_name ?? asset.file_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(asset.size)} ·{" "}
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="max-w-[140px] truncate text-[10px]"
                      title={asset.user_email ?? undefined}
                    >
                      {asset.user_name ?? asset.user_email ?? "Unknown"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset)}
                      disabled={deletingId === asset.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                      title="Delete (admin)"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matches for “{search}”.
            </p>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => void loadPage(page + 1, true)}
              >
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type MediaAsset,
  deleteMedia,
  formatFileSize,
  listMedia,
  uploadMedia,
} from "@/lib/media-api";
import { ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/dashboard/media")({
  head: () => ({
    meta: [
      { title: `Media Library — ${APP_NAME}` },
      { name: "description", content: "Manage uploaded images for your sites." },
    ],
  }),
  component: MediaPage,
});

const PER_PAGE = 30;

function MediaPage() {
  const [items, setItems] = useState<MediaAsset[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await listMedia({ page: nextPage, per_page: PER_PAGE });
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
    return items.filter((a) =>
      (a.original_name ?? a.file_name).toLowerCase().includes(q),
    );
  }, [items, search]);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    setUploadPct(0);
    try {
      const asset = await uploadMedia(file, setUploadPct);
      setItems((prev) => (prev ? [asset, ...prev] : [asset]));
      setTotal((t) => t + 1);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadPct(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!confirm(`Delete "${asset.original_name ?? asset.file_name}"? This cannot be undone.`)) return;
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

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch {
      toast.error("Couldn't copy URL");
    }
  }

  const hasMore = items ? items.length < total : false;
  const showSkeleton = items === null;
  const showEmpty = items !== null && items.length === 0 && !uploading;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Upload images once, reuse them across your sites and sections.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-1.5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </header>

      {uploading && (
        <div>
          <Progress value={uploadPct} />
          <p className="mt-1 text-right text-xs text-muted-foreground">{uploadPct}%</p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename…"
          className="pl-9"
        />
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-medium">No media uploaded yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your first image to start building your library.
          </p>
          <Button onClick={() => inputRef.current?.click()} className="mt-4 gap-1.5">
            <Upload className="h-4 w-4" />
            Upload your first image
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(filtered ?? []).map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => copyUrl(asset.file_url)}
                  className="block aspect-square w-full overflow-hidden bg-muted/40"
                  title="Click to copy URL"
                >
                  <img
                    src={asset.file_url}
                    alt={asset.original_name ?? asset.file_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
                <div className="flex items-center justify-between gap-2 border-t border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {asset.original_name ?? asset.file_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(asset.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset)}
                    disabled={deletingId === asset.id}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                    title="Delete"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
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

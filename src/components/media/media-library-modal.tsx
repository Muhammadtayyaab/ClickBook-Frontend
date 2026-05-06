import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
}

const PER_PAGE = 24;

export function MediaLibraryModal({ open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await listMedia({ page: nextPage, per_page: PER_PAGE });
      setTotal(res.total);
      setPage(res.page);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setPage(1);
    setTotal(0);
    void loadPage(1, false);
  }, [open, loadPage]);

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
      setItems((prev) => [asset, ...prev]);
      setTotal((t) => t + 1);
      toast.success("Image uploaded");
      onSelect(asset);
      onClose();
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
      setItems((prev) => prev.filter((a) => a.id !== asset.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const hasMore = items.length < total;
  const showSkeleton = loading && items.length === 0;
  const showEmpty = !loading && items.length === 0 && !uploading;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Pick an existing image or upload a new one. Uploads are saved to your library and reusable across sections.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-md border border-dashed transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border p-3">
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${total} item${total === 1 ? "" : "s"}` : "Drag & drop an image, or"}
            </p>
            <Button
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {uploading && (
            <div className="px-3 pt-3">
              <Progress value={uploadPct} />
              <p className="mt-1 text-right text-xs text-muted-foreground">{uploadPct}%</p>
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto p-3">
            {showSkeleton ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-md" />
                ))}
              </div>
            ) : showEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
                <p className="mt-3 text-sm font-medium text-foreground">No media uploaded yet</p>
                <p className="mt-1 text-xs">Drag a file here, or click Upload to add your first image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((asset) => (
                  <MediaTile
                    key={asset.id}
                    asset={asset}
                    deleting={deletingId === asset.id}
                    onSelect={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    onDelete={() => handleDelete(asset)}
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-4 flex justify-center">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaTile({
  asset,
  deleting,
  onSelect,
  onDelete,
}: {
  asset: MediaAsset;
  deleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted/40">
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 h-full w-full"
        title={asset.original_name ?? asset.file_name}
      >
        <img
          src={asset.file_url}
          alt={asset.original_name ?? asset.file_name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </button>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="pointer-events-auto flex justify-end p-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={deleting}
            className="rounded-md bg-black/60 p-1.5 text-white hover:bg-red-600 disabled:opacity-60"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="px-2 pb-2 text-[10px] text-white">
          <p className="truncate font-medium">{asset.original_name ?? asset.file_name}</p>
          <p className="opacity-80">{formatFileSize(asset.size)}</p>
        </div>
      </div>
    </div>
  );
}

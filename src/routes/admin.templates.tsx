import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  deleteTemplate,
  listTemplates,
  type AdminTemplate,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { TemplateFormDialog } from "@/components/admin/template-form-dialog";

export const Route = createFileRoute("/admin/templates")({
  component: TemplatesAdminPage,
});

const CATEGORIES = [
  "all", "business", "gym", "spa", "real_estate", "restaurant",
  "portfolio", "agency", "medical", "education", "ecommerce",
] as const;

function TemplatesAdminPage() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTpl, setEditTpl] = useState<AdminTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listTemplates({
        search: search || undefined,
        category: category === "all" ? undefined : category,
      });
      setTemplates(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget.id);
      toast.success(`${deleteTarget.name} deactivated`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
          <p className="text-sm text-muted-foreground">Manage the template catalog.</p>
        </div>
        <Button onClick={() => { setEditTpl(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New template
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search templates by name…"
        >
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All categories" : c.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataTableToolbar>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[4/3] bg-muted">
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No thumbnail
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  {t.is_featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20" variant="outline">
                      <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                    </Badge>
                  )}
                  {!t.is_active && <Badge variant="destructive">Inactive</Badge>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t.category.replace("_", " ")} · {t.usage_count} uses
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          to="/editor/$templateId"
                          params={{ templateId: t.id }}
                          search={{ from: "/admin/templates" }}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditTpl(t); setDialogOpen(true); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {t.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editTpl}
        onSaved={load}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The template will be hidden from the public catalog. Existing sites built from it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

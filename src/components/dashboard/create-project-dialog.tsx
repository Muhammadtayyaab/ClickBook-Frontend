import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImageOff, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createProject, listBackendTemplates, type BackendTemplate } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  /** Pre-select a template (e.g. when opened from the Templates page). */
  presetTemplateId?: string;
}

export function CreateProjectDialog({ open, onClose, onCreated, presetTemplateId }: Props) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BackendTemplate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    listBackendTemplates()
      .then((t) => {
        setTemplates(t);
        if (presetTemplateId && t.some((tpl) => tpl.id === presetTemplateId)) {
          setSelected(presetTemplateId);
        } else if (!presetTemplateId) {
          setSelected(t[0]?.id ?? null);
        }
      })
      .catch(() => toast.error("Failed to load templates"));
  }, [open, presetTemplateId]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setName("");
      setSubmitting(false);
    }
  }, [open]);

  async function handleCreate() {
    if (!selected) {
      toast.error("Pick a template first");
      return;
    }
    const trimmed = name.trim() || "Untitled project";
    setSubmitting(true);
    try {
      const project = await createProject({ template_id: selected, name: trimmed });
      toast.success("Project created");
      onCreated?.();
      onClose();
      navigate({
        to: "/editor/$templateId",
        params: { templateId: project.template_id },
        search: { siteId: project.id },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Create a new project
          </DialogTitle>
          <DialogDescription>Pick a template to start from and name your project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My new website"
              autoFocus
            />
          </div>

          <div>
            <Label>Template</Label>
            {!templates ? (
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <p className="mt-2 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No templates available yet.
              </p>
            ) : (
              <div className="mt-2 grid max-h-[320px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                {templates.map((t) => (
                  <TemplateOption
                    key={t.id}
                    template={t}
                    selected={selected === t.id}
                    onSelect={() => setSelected(t.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleCreate} disabled={submitting || !selected}>
            {submitting ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateOption({
  template,
  selected,
  onSelect,
}: {
  template: BackendTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const [err, setErr] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group overflow-hidden rounded-lg border text-left transition hover:border-primary/60",
        selected ? "border-primary ring-2 ring-primary/25" : "border-border",
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {template.thumbnail_url && !err ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            onError={() => setErr(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium">{template.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{template.category.replace("_", " ")}</p>
      </div>
    </button>
  );
}
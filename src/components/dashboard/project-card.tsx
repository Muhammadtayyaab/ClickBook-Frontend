import { Link } from "@tanstack/react-router";
import { BarChart3, Copy, Edit3, ExternalLink, Globe, MoreVertical, Pencil, Rocket, Trash2, RotateCcw, ImageOff } from "lucide-react";
import { useState } from "react";
import type { ProjectCard as Project } from "@/lib/projects-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  project: Project;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPublishToggle: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ProjectCardView({ project, onRename, onDuplicate, onDelete, onPublishToggle }: Props) {
  const [imgError, setImgError] = useState(false);
  const isPublished = project.status === "published";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-card">
        {project.thumbnail && !imgError ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/60">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <StatusBadge status={project.status} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{project.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {project.template_name ?? "Custom"} · updated {formatDate(project.updated_at)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={onRename}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard/analytics/$projectId"
                  params={{ projectId: project.id }}
                  className="flex items-center"
                >
                  <BarChart3 className="mr-2 h-3.5 w-3.5" /> Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard/projects/$projectId/domains"
                  params={{ projectId: project.id }}
                  className="flex items-center"
                >
                  <Globe className="mr-2 h-3.5 w-3.5" /> Domains
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onPublishToggle}>
                {isPublished ? (
                  <><RotateCcw className="mr-2 h-3.5 w-3.5" /> Unpublish</>
                ) : (
                  <><Rocket className="mr-2 h-3.5 w-3.5" /> Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/editor/$templateId" params={{ templateId: project.template_id }} search={{ siteId: project.id }}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          {isPublished ? (
            <Button asChild variant="hero" size="sm" className="flex-1">
              <Link to="/site/$siteId" params={{ siteId: project.id }} target="_blank">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Live
              </Link>
            </Button>
          ) : (
            <Button variant="hero" size="sm" className="flex-1" onClick={onPublishToggle}>
              <Rocket className="mr-1.5 h-3.5 w-3.5" /> Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: Project["status"] }) {
  const config = {
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    published: { label: "Published", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    unpublished: { label: "Unpublished", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  }[status];
  return (
    <span
      className={cn(
        "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur",
        config.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "published" ? "bg-emerald-500" : status === "draft" ? "bg-muted-foreground" : "bg-amber-500")} />
      {config.label}
    </span>
  );
}
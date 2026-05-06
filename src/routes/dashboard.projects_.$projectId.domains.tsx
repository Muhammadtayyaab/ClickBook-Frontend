import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomDomainSection } from "@/components/dashboard/custom-domain-section";
import { getProject, type ProjectDetail } from "@/lib/projects-api";
import { ApiError } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/dashboard/projects_/$projectId/domains")({
  head: () => ({ meta: [{ title: `Domains — ${APP_NAME}` }] }),
  component: ProjectDomainsPage,
});

function ProjectDomainsPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load project"));
  }, [projectId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/projects">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to projects
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : !project ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Domain settings · Status: <span className="font-medium">{project.status}</span>
            </p>
          </header>
          <CustomDomainSection projectId={project.id} />
        </>
      )}
    </div>
  );
}

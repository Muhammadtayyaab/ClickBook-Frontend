import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listProjects, type ProjectCard } from "@/lib/projects-api";

export const Route = createFileRoute("/dashboard/analytics/")({
  component: AnalyticsIndex,
});

function AnalyticsIndex() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectCard[] | null>(null);

  useEffect(() => {
    listProjects({ status: "all" })
      .then((res) => {
        setProjects(res.data);
        // Auto-jump into the first published site, falling back to any site.
        const first =
          res.data.find((p) => p.status === "published") ?? res.data[0];
        if (first) {
          navigate({
            to: "/dashboard/analytics/$projectId",
            params: { projectId: first.id },
            replace: true,
          });
        }
      })
      .catch(() => setProjects([]));
  }, [navigate]);

  if (projects === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">No projects to analyze</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a project and publish it to start collecting traffic data.
          </p>
          <Button asChild variant="hero" className="mt-5">
            <Link to="/dashboard/projects">Create a project</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Redirecting — render nothing visible while navigation kicks in.
  return null;
}
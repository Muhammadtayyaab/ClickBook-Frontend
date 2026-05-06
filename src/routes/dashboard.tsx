import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: `Dashboard — ${APP_NAME}` },
      { name: "description", content: "Manage your websites, drafts, and published sites." },
    ],
  }),
  component: DashboardLayout,
});
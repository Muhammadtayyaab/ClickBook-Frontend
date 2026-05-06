import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/admin-layout";
import { APP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: `Admin — ${APP_NAME}` }],
  }),
  component: AdminLayout,
});

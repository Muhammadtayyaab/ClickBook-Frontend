import { apiFetch } from "./api";

export interface NotificationPrefs {
  email_notifications_enabled: boolean;
  contact_email: string;
  is_default_email: boolean;
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const res = await apiFetch<{ data: NotificationPrefs }>("/api/user/notifications");
  return res.data;
}

export async function updateNotificationPrefs(input: {
  email_notifications_enabled?: boolean;
  contact_email?: string | null;
}): Promise<void> {
  await apiFetch("/api/user/notifications", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function submitContactForm(
  siteId: string,
  input: { name: string; email: string; message: string },
): Promise<{ message: string }> {
  const res = await apiFetch<{ data: { message: string } }>(`/api/contact/${siteId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

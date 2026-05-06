/**
 * Typed wrappers around admin REST endpoints.
 * All functions throw ApiError on non-2xx.
 */
import { apiFetch, ApiError } from "@/lib/api";

export { ApiError };

// ---------- Dashboard ----------
export interface DashboardStats {
  total_users: number;
  total_templates: number;
  total_sites: number;
  total_revenue: number;
  monthly_revenue: number;
  prev_month_revenue: number;
  active_subscriptions: number;
  churn_rate: number;
  new_signups_30d: number;
  signups_by_month: { month: string; count: number }[];
  revenue_by_month: { month: string; amount: number }[];
}

export function getDashboard() {
  return apiFetch<{ data: DashboardStats }>("/api/admin/dashboard").then((r) => r.data);
}

export interface ActivityEntry {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  actor: { id: string | null; name: string; email: string | null } | null;
  created_at: string;
}

export function getActivity(limit = 20) {
  return apiFetch<{ data: ActivityEntry[] }>(`/api/admin/activity?limit=${limit}`).then((r) => r.data);
}

// ---------- Users ----------
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  is_active: boolean;
  avatar_url?: string | null;
  last_login_at?: string | null;
  created_at: string;
  site_count?: number;
  total_spend?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export function listUsers(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  return apiFetch<Paginated<AdminUser>>(`/api/admin/users?${qs.toString()}`);
}

export function createUser(body: {
  name: string;
  email: string;
  password: string;
  role?: string;
  plan?: string;
  is_active?: boolean;
}) {
  return apiFetch<{ data: AdminUser }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function updateUser(id: string, body: Partial<AdminUser> & { password?: string }) {
  return apiFetch<{ data: AdminUser }>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function suspendUser(id: string) {
  return apiFetch<{ data: AdminUser }>(`/api/admin/users/${id}/suspend`, { method: "POST" }).then((r) => r.data);
}

export function activateUser(id: string) {
  return apiFetch<{ data: AdminUser }>(`/api/admin/users/${id}/activate`, { method: "POST" }).then((r) => r.data);
}

export function deleteUser(id: string) {
  return apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}

// ---------- Templates ----------
export interface AdminTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  sections_config: Array<Record<string, unknown>>;
  pages?: Record<string, unknown>;
  global_styles: Record<string, unknown>;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export function listTemplates(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  return apiFetch<{ data: AdminTemplate[] }>(`/api/admin/templates?${qs}`).then((r) => r.data);
}

export function createTemplate(body: Partial<AdminTemplate>) {
  return apiFetch<{ data: AdminTemplate }>("/api/admin/templates", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function updateTemplate(id: string, body: Partial<AdminTemplate>) {
  return apiFetch<{ data: AdminTemplate }>(`/api/admin/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function deleteTemplate(id: string) {
  return apiFetch(`/api/admin/templates/${id}`, { method: "DELETE" });
}

// ---------- Payments ----------
export interface AdminPayment {
  id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  billing_period: string;
  created_at: string;
}

export function listPayments(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  return apiFetch<Paginated<AdminPayment>>(`/api/admin/payments?${qs}`);
}

/**
 * Trigger a CSV download for the given admin export endpoint.
 * Uses fetch directly because apiFetch parses JSON.
 */
export async function downloadCsv(path: string, filename: string) {
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://clickbook-backend-production.up.railway.app";
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem("auth_token") ?? localStorage.getItem("auth_token")
    : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status, null);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

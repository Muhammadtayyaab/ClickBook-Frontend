/**
 * Typed wrappers for end-user project (site) endpoints. All functions throw
 * ApiError on non-2xx; UI layer catches and shows toasts.
 */
import { apiFetch } from "@/lib/api";

export type ProjectStatus = "draft" | "published" | "unpublished";

export interface ProjectCard {
  id: string;
  name: string;
  template_id: string;
  template_name: string | null;
  thumbnail: string | null;
  status: ProjectStatus;
  domain: string | null;
  hosted_url: string | null;
  page_views: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectStats {
  total: number;
  drafts: number;
  published: number;
  unpublished: number;
  total_views: number;
  recent: ProjectCard[];
}

export interface ProjectDetail {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  global_styles: Record<string, unknown>;
  status: ProjectStatus;
  hosted_url: string | null;
  favicon_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  page_views: number;
  created_at: string;
  updated_at: string;
  pages: Array<{
    id: string;
    site_id: string;
    name: string;
    slug: string;
    order: number;
    is_homepage: boolean;
    sections: Array<Record<string, unknown>>;
    updated_at: string;
  }>;
}

export interface PublicSitePage {
  id: string;
  name: string;
  slug: string;
  order: number;
  is_homepage: boolean;
  sections: Array<Record<string, unknown>>;
}

export interface PublicSitePayload {
  id: string;
  name: string;
  meta_title: string;
  meta_description: string | null;
  favicon_url: string | null;
  global_styles: Record<string, unknown>;
  sections: Array<Record<string, unknown>>;
  current_page: string | null;
  pages: PublicSitePage[];
  page_views: number;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

interface Wrapped<T> {
  success: boolean;
  data: T;
}

export function getStats() {
  return apiFetch<Wrapped<ProjectStats>>("/api/sites/stats").then((r) => r.data);
}

export function listProjects(params: { status?: ProjectStatus | "all"; search?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  qs.set("per_page", "48");
  return apiFetch<Paginated<ProjectCard>>(`/api/sites/my?${qs.toString()}`);
}

export function getProject(id: string) {
  return apiFetch<Wrapped<ProjectDetail>>(`/api/sites/${id}`).then((r) => r.data);
}

export function createProject(body: { template_id: string; name: string }) {
  return apiFetch<Wrapped<ProjectCard>>("/api/sites/", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function renameProject(id: string, name: string) {
  return apiFetch<Wrapped<ProjectCard>>(`/api/sites/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  }).then((r) => r.data);
}

export function deleteProject(id: string) {
  return apiFetch(`/api/sites/${id}`, { method: "DELETE" });
}

export function duplicateProject(id: string) {
  return apiFetch<Wrapped<ProjectCard>>(`/api/sites/${id}/duplicate`, { method: "POST" }).then((r) => r.data);
}

export function publishProject(id: string) {
  return apiFetch<Wrapped<ProjectCard>>(`/api/sites/${id}/publish`, { method: "POST" }).then((r) => r.data);
}

export function unpublishProject(id: string) {
  return apiFetch<Wrapped<ProjectCard>>(`/api/sites/${id}/unpublish`, { method: "POST" }).then((r) => r.data);
}

export function updateGlobalStyles(id: string, global_styles: Record<string, unknown>) {
  return apiFetch<Wrapped<ProjectDetail>>(`/api/sites/${id}/global-styles`, {
    method: "PUT",
    body: JSON.stringify({ global_styles }),
  }).then((r) => r.data);
}

export function saveSections(
  id: string,
  sections: Array<Record<string, unknown>>,
  pageSlug: string = "home",
) {
  return apiFetch<Wrapped<{ sections: Array<Record<string, unknown>>; updated_at: string; slug: string }>>(
    `/api/sites/${id}/pages/${pageSlug}/sections`,
    { method: "PUT", body: JSON.stringify({ sections }) },
  ).then((r) => r.data);
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
}

/**
 * POST a file to the backend's /api/upload endpoint as multipart/form-data and
 * return the public URL we should drop into the section's data.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem("auth_token") ?? localStorage.getItem("auth_token")
    : null;
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: fd,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string")
      ? (data as { message: string }).message
      : `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  return (data as { data: UploadResult }).data;
}

export interface BackendTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export function listBackendTemplates() {
  return apiFetch<Wrapped<BackendTemplate[]>>("/api/templates/?per_page=100").then((r) => r.data);
}

export function getPublicSite(id: string, page?: string) {
  const qs = page ? `?page=${encodeURIComponent(page)}` : "";
  return apiFetch<Wrapped<PublicSitePayload>>(`/api/public/sites/${id}${qs}`).then((r) => r.data);
}
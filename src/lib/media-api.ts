/**
 * Typed wrappers for the central media library.
 * Backend: backend/app/routes/media_routes.py
 */
import { ApiError, apiFetch } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://clickbook-backend-production.up.railway.app";

export interface MediaAsset {
  id: string;
  file_name: string;
  original_name: string | null;
  file_url: string;
  file_path: string;
  file_type: string;
  size: number;
  created_at: string;
}

export interface MediaListResponse {
  items: MediaAsset[];
  page: number;
  per_page: number;
  total: number;
}

interface Wrapped<T> {
  success: boolean;
  data: T;
}

export function listMedia(params: { page?: number; per_page?: number } = {}): Promise<MediaListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Wrapped<MediaListResponse>>(`/api/media${suffix}`).then((r) => r.data);
}

export interface AdminMediaAsset extends MediaAsset {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
}

export interface AdminMediaListResponse {
  items: AdminMediaAsset[];
  page: number;
  per_page: number;
  total: number;
}

/** Admin-only: list every user's assets. Backend gates on the JWT role. */
export function listAllMedia(params: { page?: number; per_page?: number } = {}): Promise<AdminMediaListResponse> {
  const qs = new URLSearchParams({ all: "1" });
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  return apiFetch<Wrapped<AdminMediaListResponse>>(`/api/media?${qs.toString()}`).then((r) => r.data);
}

export function deleteMedia(id: string): Promise<{ deleted: string }> {
  return apiFetch<Wrapped<{ deleted: string }>>(`/api/media/${id}`, {
    method: "DELETE",
  }).then((r) => r.data);
}

/**
 * Upload an image to the central library. Uses XHR (not fetch) so we can
 * surface real upload progress to the UI — the fetch API doesn't expose
 * progress on the request body in a portable way.
 */
export function uploadMedia(file: File, onProgress?: (pct: number) => void): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("auth_token") ?? localStorage.getItem("auth_token")
        : null;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/media/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      const text = xhr.responseText;
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = (body as Wrapped<MediaAsset> | null)?.data;
        if (data) {
          resolve(data);
          return;
        }
        reject(new ApiError("Empty upload response", xhr.status, body));
        return;
      }
      const msg =
        body && typeof body === "object" && "message" in body && typeof (body as { message: unknown }).message === "string"
          ? (body as { message: string }).message
          : `Upload failed with ${xhr.status}`;
      reject(new ApiError(msg, xhr.status, body));
    };

    xhr.onerror = () => reject(new ApiError("Network error during upload", 0, null));
    xhr.onabort = () => reject(new ApiError("Upload aborted", 0, null));

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

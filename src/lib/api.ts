const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://clickbook-backend-production.up.railway.app";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  } 
}

/**
 * Paths that should NOT trigger auto-signout on a 401. The login endpoint
 * returns 401 for bad credentials and the caller surfaces the error inline.
 */
const AUTH_SKIP_SIGNOUT_PATHS = ["/api/auth/login"];

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem("auth_token") ?? localStorage.getItem("auth_token")
    : null;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // Token expired or revoked (e.g. logged out in another tab): clear client
    // state and redirect to signin so protected pages don't flicker stale data.
    if (res.status === 401 && !AUTH_SKIP_SIGNOUT_PATHS.includes(path)) {
      const { forceSignOut } = await import("@/stores/auth-store");
      forceSignOut();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
        window.location.replace("/signin");
      }
    }
    const msg = (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string")
      ? (data as { message: string }).message
      : `Request failed with ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

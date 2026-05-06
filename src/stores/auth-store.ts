import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiFetch } from "@/lib/api";

// Read the persisted auth blob synchronously at module load. This avoids the
// async-rehydration race where dashboard/admin guards see token=null on first
// render and bounce to /signin on refresh.
function readPersistedAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const raw = sessionStorage.getItem("clickbook-auth");
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as { state?: { token?: string | null; user?: AuthUser | null } };
    return {
      token: parsed.state?.token ?? null,
      user: parsed.state?.user ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  plan_expires_at?: string | null;
  avatar_url?: string | null;
  email_notifications_enabled?: boolean;
  contact_email?: string | null;
}

interface AuthResponse {
  success: boolean;
  data: { token: string; user: AuthUser };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** Update the cached user object (e.g. after profile edits). */
  setUser: (user: AuthUser | null) => void;
  /** Returns the authenticated user so callers can branch on role immediately. */
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Creates an account and signs the user in. Returns the new user. */
  register: (input: RegisterInput) => Promise<AuthUser>;
  /** Revokes the token on the server (best-effort) and clears client state. */
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "auth_token";

const __initialAuth = readPersistedAuth();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: __initialAuth.token,
      user: __initialAuth.user,
      setUser: (user) => set({ user }),
      login: async (email, password) => {
        const res = await apiFetch<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        sessionStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
        set({ token: res.data.token, user: res.data.user });
        return res.data.user;
      },
      register: async ({ name, email, password }) => {
        const res = await apiFetch<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        sessionStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
        set({ token: res.data.token, user: res.data.user });
        return res.data.user;
      },
      logout: async () => {
        // Best-effort server-side revocation: the backend adds the JTI to the
        // token blocklist. We swallow errors so the client still logs out if
        // the network is down or the token is already expired.
        if (get().token) {
          try {
            await apiFetch("/api/auth/logout", { method: "POST" });
          } catch {
            // Intentional: client-side cleanup is authoritative for UX.
          }
        }
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({ token: null, user: null });
      },
    }),
    {
      name: "clickbook-auth",
      // Use sessionStorage so a fresh browser/tab does not auto-sign-in the
      // last user. The token clears when the tab closes.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

/** Imperative client-side sign-out for use outside React (e.g. fetch 401 handler). */
export function forceSignOut() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  // Also clear the zustand-persist blob so a refresh doesn't restore the token.
  sessionStorage.removeItem("clickbook-auth");
  useAuthStore.setState({ token: null, user: null });
}

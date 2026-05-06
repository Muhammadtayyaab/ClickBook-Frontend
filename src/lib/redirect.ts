/**
 * Helpers for safely handling a post-auth `redirect` search param.
 *
 * Only same-origin absolute paths (starting with "/", not "//") are allowed —
 * this prevents an open-redirect where a malicious link could send users to
 * an external site after signing in.
 */
export function isSafeRedirect(target: unknown): target is string {
  return (
    typeof target === "string" &&
    target.length > 0 &&
    target.length < 512 &&
    target.startsWith("/") &&
    !target.startsWith("//")
  );
}

export function sanitizeRedirect(target: unknown): string | undefined {
  return isSafeRedirect(target) ? target : undefined;
}

export const POST_AUTH_INTENTS = ["publish"] as const;
export type PostAuthIntent = (typeof POST_AUTH_INTENTS)[number];

export function sanitizeIntent(value: unknown): PostAuthIntent | undefined {
  return typeof value === "string" && (POST_AUTH_INTENTS as readonly string[]).includes(value)
    ? (value as PostAuthIntent)
    : undefined;
}

/** Build `/signup?redirect=...&intent=...` (or `/signin`) preserving both params. */
export function authRedirectHref(
  base: "/signin" | "/signup",
  redirect: string,
  intent?: PostAuthIntent,
): string {
  const params = new URLSearchParams();
  params.set("redirect", redirect);
  if (intent) params.set("intent", intent);
  return `${base}?${params.toString()}`;
}
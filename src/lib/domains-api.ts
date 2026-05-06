/**
 * Typed wrappers for /api/domains. The backend distinguishes "subdomain"
 * (auto-assigned *.sitecraft.app) from "custom" (user-owned). The custom-domain
 * UI only ever cares about the latter — verification is a TXT-record check
 * against `_sitecraft-verification.<domain>` on the backend.
 */
import { apiFetch } from "@/lib/api";

export type DomainKind = "subdomain" | "custom";

export interface DomainRecord {
  id: string;
  site_id: string;
  domain: string;
  type: DomainKind;
  is_verified: boolean;
  verification_token: string | null;
  ssl_status: string;
  created_at: string;
}

interface Wrapped<T> {
  success: boolean;
  data: T;
}

export interface AddCustomDomainResult {
  domain: DomainRecord;
  instructions: string;
}

/**
 * Add a custom domain to a site. Backend creates a TXT verification token and
 * returns a one-line instructions string the UI can render verbatim. The
 * domain starts unverified; call {@link verifyDomain} once the user has
 * configured their DNS.
 */
export function addDomain(projectId: string, domain: string) {
  return apiFetch<Wrapped<AddCustomDomainResult>>("/api/domains/add-custom-domain", {
    method: "POST",
    body: JSON.stringify({ site_id: projectId, domain }),
  }).then((r) => r.data);
}

/** List every domain (subdomain + custom) attached to a site. */
export function getDomains(projectId: string) {
  return apiFetch<Wrapped<DomainRecord[]>>(`/api/domains/site/${projectId}`).then((r) => r.data);
}

/**
 * Trigger a real DNS lookup against the user's TXT record. On success the
 * backend flips `is_verified` and copies the domain onto Site.custom_domain so
 * host-based routing starts working immediately.
 */
export function verifyDomain(domain: string) {
  return apiFetch<Wrapped<DomainRecord>>("/api/domains/verify-custom-domain", {
    method: "POST",
    body: JSON.stringify({ domain }),
  }).then((r) => r.data);
}

export function deleteDomain(domainId: string) {
  return apiFetch<Wrapped<{ id: string }>>(`/api/domains/${domainId}`, {
    method: "DELETE",
  }).then((r) => r.data);
}

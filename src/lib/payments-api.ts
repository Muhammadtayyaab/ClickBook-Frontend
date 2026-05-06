/**
 * Typed wrappers for checkout + billing endpoints.
 * Backend: backend/app/routes/checkout_routes.py + backend/app/routes/payment_routes.py
 */
import { apiFetch } from "@/lib/api";

export type Plan = "starter" | "pro" | "business";
export type BillingPeriod = "monthly" | "yearly";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  site_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: Plan;
  billing_period: BillingPeriod;
  created_at: string;
}

interface Wrapped<T> {
  success: boolean;
  data: T;
}

interface Paginated<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// USD prices in cents. Keep in sync with backend `backend/app/services/stripe_service.py`.
export const PLAN_PRICES: Record<
  Plan,
  {
    monthly: number;
    yearly: number;
    label: string;
    tagline: string;
    features: string[];
  }
> = {
  starter: {
    monthly: 1900,
    yearly: 19000,
    label: "Starter",
    tagline: "Launch a single site",
    features: ["1 published site", "ClickBook subdomain", "Email support"],
  },
  pro: {
    monthly: 4900,
    yearly: 49000,
    label: "Pro",
    tagline: "For growing brands",
    features: ["5 published sites", "Custom domain", "Priority support", "Remove ClickBook badge"],
  },
  business: {
    monthly: 9900,
    yearly: 99000,
    label: "Business",
    tagline: "For agencies & teams",
    features: ["Unlimited sites", "Multiple custom domains", "Team seats", "Dedicated support"],
  },
};

export function getPlanAmount(plan: Plan, period: BillingPeriod): number {
  const meta = PLAN_PRICES[plan];
  return period === "monthly" ? meta.monthly : meta.yearly;
}

export function formatAmount(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function createCheckoutSession(body: {
  site_id: string;
  plan: Plan;
  billing_period: BillingPeriod;
}): Promise<CheckoutSession> {
  return apiFetch<Wrapped<CheckoutSession>>("/api/payments/stripe/create-session", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export function createTemplateStripeSession(body: {
  template_id: string;
  project_name?: string;
  plan: Plan;
  billing_period: BillingPeriod;
}) {
  return apiFetch<Wrapped<CheckoutSession>>("/api/payments/stripe/create-session", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.data);
}

export interface VerifySessionResponse {
  status: "paid" | "unpaid";
  payment_status: string | null;
  session_status: string | null;
  local_status: PaymentStatus;
  site_id: string | null;
  payment: PaymentRecord;
}

export function verifyStripeSession(session_id: string): Promise<VerifySessionResponse> {
  const qs = new URLSearchParams({ session_id });
  return apiFetch<Wrapped<VerifySessionResponse>>(
    `/api/payments/stripe/verify-session?${qs.toString()}`,
    { method: "GET" },
  ).then((r) => r.data);
}

export function listMyPayments(params: { page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<Paginated<PaymentRecord>>(`/api/payments/my${suffix}`);
}

export interface SubscriptionStatus {
  plan: string;
  effective_plan: string;
  is_active: boolean;
  expires_at: string | null;
  days_remaining: number;
  publish_limit: number | null;
  publish_used: number;
  publish_remaining: number | null;
}

export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<Wrapped<SubscriptionStatus>>("/api/auth/me/subscription").then(
    (r) => r.data,
  );
}

export function cancelSubscription(): Promise<{ message: string }> {
  return apiFetch<Wrapped<{ message: string }>>("/api/auth/me/unsubscribe", {
    method: "POST",
  }).then((r) => r.data);
}
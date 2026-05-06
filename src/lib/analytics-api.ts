import { apiFetch } from "@/lib/api";

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface AnalyticsSummary {
  total_views: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
}

export interface AnalyticsPoint {
  date: string;
  views: number;
}

export interface TopPage {
  page_slug: string;
  views: number;
}

interface Wrapped<T> {
  success: boolean;
  data: T;
}

export function getSummary(projectId: string) {
  return apiFetch<Wrapped<AnalyticsSummary>>(
    `/api/analytics/summary/${projectId}`,
  ).then((r) => r.data);
}

export function getTimeseries(projectId: string, range: AnalyticsRange = "7d") {
  return apiFetch<Wrapped<AnalyticsPoint[]>>(
    `/api/analytics/timeseries/${projectId}?range=${range}`,
  ).then((r) => r.data);
}

export function getTopPages(
  projectId: string,
  range: AnalyticsRange = "30d",
  limit = 10,
) {
  return apiFetch<Wrapped<TopPage[]>>(
    `/api/analytics/top-pages/${projectId}?range=${range}&limit=${limit}`,
  ).then((r) => r.data);
}
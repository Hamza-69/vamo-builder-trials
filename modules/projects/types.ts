import type { Database } from "@/types/supabase";
import type { ReadonlyURLSearchParams } from "next/navigation";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export type SortOption =
  | "newest"
  | "oldest"
  | "progress_asc"
  | "progress_desc"
  | "valuation_low"
  | "valuation_high";

export interface ProjectFilters {
  search: string;
  sortBy: SortOption;
  valuationMin: string;
  valuationMax: string;
  progressMin: string;
  progressMax: string;
  page: number;
}

export const DEFAULT_FILTERS: ProjectFilters = {
  search: "",
  sortBy: "newest",
  valuationMin: "",
  valuationMax: "",
  progressMin: "",
  progressMax: "",
  page: 1,
};

export const PROJECTS_PER_PAGE = 12;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "progress_desc", label: "Progress: High → Low" },
  { value: "progress_asc", label: "Progress: Low → High" },
  { value: "valuation_high", label: "Valuation: High → Low" },
  { value: "valuation_low", label: "Valuation: Low → High" },
];

const VALID_SORT: Set<string> = new Set(SORT_OPTIONS.map((o) => o.value));

/** Parse filters from URL search params. */
export function filtersFromParams(
  params: ReadonlyURLSearchParams,
): ProjectFilters {
  const sortRaw = params.get("sortBy") ?? "";
  return {
    search: params.get("search") ?? "",
    sortBy: VALID_SORT.has(sortRaw) ? (sortRaw as SortOption) : "newest",
    valuationMin: params.get("valuationMin") ?? "",
    valuationMax: params.get("valuationMax") ?? "",
    progressMin: params.get("progressMin") ?? "",
    progressMax: params.get("progressMax") ?? "",
    page: Math.max(1, Number(params.get("page") || 1)),
  };
}

/** Serialize filters to a URLSearchParams string (skips empty values). */
export function filtersToParams(filters: ProjectFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  if (filters.valuationMin) params.set("valuationMin", filters.valuationMin);
  if (filters.valuationMax) params.set("valuationMax", filters.valuationMax);
  if (filters.progressMin) params.set("progressMin", filters.progressMin);
  if (filters.progressMax) params.set("progressMax", filters.progressMax);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

import type { Database } from "@/types/supabase";
import type { ReadonlyURLSearchParams } from "next/navigation";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];

export type ListingSortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "progress_asc"
  | "progress_desc";

export interface ListingFilters {
  search: string;
  sortBy: ListingSortOption;
  priceMin: string;
  priceMax: string;
  progressMin: string;
  progressMax: string;
  page: number;
}

export const DEFAULT_LISTING_FILTERS: ListingFilters = {
  search: "",
  sortBy: "newest",
  priceMin: "",
  priceMax: "",
  progressMin: "",
  progressMax: "",
  page: 1,
};

export const LISTING_SORT_OPTIONS: { value: ListingSortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "progress_desc", label: "Progress: High → Low" },
  { value: "progress_asc", label: "Progress: Low → High" },
];

const VALID_LISTING_SORT: Set<string> = new Set(
  LISTING_SORT_OPTIONS.map((o) => o.value),
);

export interface ListingWithProject extends Listing {
  projects: {
    progress_score: number | null;
    screenshot_url: string | null;
    url: string | null;
    name: string;
  };
  is_outdated?: boolean;
}

export interface ListingDetail extends Listing {
  projects: {
    id: string;
    name: string;
    description: string | null;
    progress_score: number | null;
    screenshot_url: string | null;
    url: string | null;
  };
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  is_outdated?: boolean;
}

export interface ListingMetrics {
  progress_score: number;
  prompt_count: number;
  traction_signals: number;
  timeline_snapshot: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string | null;
}

export function listingFiltersFromParams(
  params: ReadonlyURLSearchParams,
): ListingFilters {
  const sortRaw = params.get("sortBy") ?? "";
  return {
    search: params.get("search") ?? "",
    sortBy: VALID_LISTING_SORT.has(sortRaw)
      ? (sortRaw as ListingSortOption)
      : "newest",
    priceMin: params.get("priceMin") ?? "",
    priceMax: params.get("priceMax") ?? "",
    progressMin: params.get("progressMin") ?? "",
    progressMax: params.get("progressMax") ?? "",
    page: Math.max(1, Number(params.get("page") || 1)),
  };
}

export function listingFiltersToParams(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  if (filters.priceMin) params.set("priceMin", filters.priceMin);
  if (filters.priceMax) params.set("priceMax", filters.priceMax);
  if (filters.progressMin) params.set("progressMin", filters.progressMin);
  if (filters.progressMax) params.set("progressMax", filters.progressMax);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

export const LISTINGS_PER_PAGE = 12;

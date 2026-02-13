import type { Database } from "@/types/supabase";

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
}

export const DEFAULT_FILTERS: ProjectFilters = {
  search: "",
  sortBy: "newest",
  valuationMin: "",
  valuationMax: "",
  progressMin: "",
  progressMax: "",
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "progress_desc", label: "Progress: High → Low" },
  { value: "progress_asc", label: "Progress: Low → High" },
  { value: "valuation_high", label: "Valuation: High → Low" },
  { value: "valuation_low", label: "Valuation: Low → High" },
];

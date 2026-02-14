"use client";

import { useCallback, useState } from "react";
import type { ListingFilters, ListingWithProject } from "../types";
import { LISTINGS_PER_PAGE } from "../types";

export function useListings() {
  const [listings, setListings] = useState<ListingWithProject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (filters: ListingFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.priceMin) params.set("priceMin", filters.priceMin);
      if (filters.priceMax) params.set("priceMax", filters.priceMax);
      if (filters.progressMin) params.set("progressMin", filters.progressMin);
      if (filters.progressMax) params.set("progressMax", filters.progressMax);
      params.set("page", String(filters.page));
      params.set("perPage", String(LISTINGS_PER_PAGE));

      const res = await fetch(`/api/marketplace?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch listings");
      }

      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { listings, total, isLoading, error, fetchListings } as const;
}

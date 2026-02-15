"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListingsToolbar, ListingsGrid } from "../components";
import { useListings } from "../hooks/use-listings";
import {
  listingFiltersFromParams,
  listingFiltersToParams,
  type ListingFilters,
  type ListingWithProject,
} from "../types";

export function MarketplaceView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { listings, total, isLoading, error, fetchListings } = useListings();

  // Local state for filters — initialised from URL, then managed locally
  const [filters, setFilters] = useState<ListingFilters>(() =>
    listingFiltersFromParams(searchParams),
  );

  // Fetch whenever filters change
  useEffect(() => {
    fetchListings(filters);
  }, [filters, fetchListings]);

  // Sync URL when filters change (shallow — no server round-trip)
  useEffect(() => {
    const qs = listingFiltersToParams(filters);
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
  }, [filters, pathname]);

  const handleFiltersChange = useCallback(
    (next: ListingFilters) => {
      setFilters(next);
    },
    [],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      handleFiltersChange({ ...filters, page });
    },
    [filters, handleFiltersChange],
  );

  const handleListingClick = useCallback(
    (listing: ListingWithProject) => {
      router.push(`/marketplace/${listing.id}`);
    },
    [router],
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Discover and acquire vetted early-stage projects.
        </p>
      </div>

      {/* Toolbar — search, sort, filter */}
      <ListingsToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Listing card grid with pagination */}
      <ListingsGrid
        listings={listings}
        total={total}
        page={filters.page}
        isLoading={isLoading}
        error={error}
        onListingClick={handleListingClick}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

"use client";

import { Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ListingCard } from "./listing-card";
import type { ListingWithProject } from "../types";
import { LISTINGS_PER_PAGE } from "../types";

interface ListingsGridProps {
  listings: ListingWithProject[];
  total: number;
  page: number;
  isLoading: boolean;
  error: string | null;
  onListingClick?: (listing: ListingWithProject) => void;
  onPageChange?: (page: number) => void;
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListingsGrid({
  listings,
  total,
  page,
  isLoading,
  error,
  onListingClick,
  onPageChange,
}: ListingsGridProps) {
  const totalPages = Math.ceil(total / LISTINGS_PER_PAGE);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">Failed to load listings</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <Store className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No listings found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={onListingClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-[36px]"
                    onClick={() => onPageChange?.(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

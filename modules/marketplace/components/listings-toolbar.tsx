"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounce";
import type { ListingFilters, ListingSortOption } from "../types";
import { LISTING_SORT_OPTIONS } from "../types";

interface ListingsToolbarProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
}

export function ListingsToolbar({
  filters,
  onFiltersChange,
}: ListingsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Local state for debounced text inputs
  const [searchValue, setSearchValue] = useState(filters.search);
  const [priceMinValue, setPriceMinValue] = useState(filters.priceMin);
  const [priceMaxValue, setPriceMaxValue] = useState(filters.priceMax);
  const [progMinValue, setProgMinValue] = useState(filters.progressMin);
  const [progMaxValue, setProgMaxValue] = useState(filters.progressMax);

  // Debounce (400ms)
  const debouncedSearch = useDebouncedValue(searchValue, 400);
  const debouncedPriceMin = useDebouncedValue(priceMinValue, 400);
  const debouncedPriceMax = useDebouncedValue(priceMaxValue, 400);
  const debouncedProgMin = useDebouncedValue(progMinValue, 400);
  const debouncedProgMax = useDebouncedValue(progMaxValue, 400);

  // Sync local state when URL params change externally
  useEffect(() => setSearchValue(filters.search), [filters.search]);
  useEffect(() => setPriceMinValue(filters.priceMin), [filters.priceMin]);
  useEffect(() => setPriceMaxValue(filters.priceMax), [filters.priceMax]);
  useEffect(() => setProgMinValue(filters.progressMin), [filters.progressMin]);
  useEffect(() => setProgMaxValue(filters.progressMax), [filters.progressMax]);

  // Push debounced values when they settle
  useEffect(() => {
    if (
      debouncedSearch !== filters.search ||
      debouncedPriceMin !== filters.priceMin ||
      debouncedPriceMax !== filters.priceMax ||
      debouncedProgMin !== filters.progressMin ||
      debouncedProgMax !== filters.progressMax
    ) {
      onFiltersChange({
        ...filters,
        search: debouncedSearch,
        priceMin: debouncedPriceMin,
        priceMax: debouncedPriceMax,
        progressMin: debouncedProgMin,
        progressMax: debouncedProgMax,
        page: 1, // reset page on filter change
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    debouncedPriceMin,
    debouncedPriceMax,
    debouncedProgMin,
    debouncedProgMax,
  ]);

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        sortBy: value as ListingSortOption,
        page: 1,
      });
    },
    [filters, onFiltersChange],
  );

  const activeFilterCount = [
    filters.priceMin,
    filters.priceMax,
    filters.progressMin,
    filters.progressMax,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setPriceMinValue("");
    setPriceMaxValue("");
    setProgMinValue("");
    setProgMaxValue("");
    onFiltersChange({
      ...filters,
      priceMin: "",
      priceMax: "",
      progressMin: "",
      progressMax: "",
      page: 1,
    });
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search listings…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sort select */}
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 w-[180px] text-sm">
              <SelectValue placeholder="Sort by…" />
            </SelectTrigger>
            <SelectContent>
              {LISTING_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`size-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Expandable filter panel */}
      {filtersOpen && (
        <div className="rounded-lg border bg-card p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price range */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                Price range
              </legend>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMinValue}
                  onChange={(e) => setPriceMinValue(e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMaxValue}
                  onChange={(e) => setPriceMaxValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </fieldset>

            {/* Progress score range */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                Progress score
              </legend>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  max={100}
                  value={progMinValue}
                  onChange={(e) => setProgMinValue(e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  max={100}
                  value={progMaxValue}
                  onChange={(e) => setProgMaxValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </fieldset>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

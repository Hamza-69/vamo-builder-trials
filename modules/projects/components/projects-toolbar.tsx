"use client";

import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { ProjectFilters, SortOption } from "../types";
import { SORT_OPTIONS } from "../types";

interface ProjectsToolbarProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onCreateNew: () => void;
}

export function ProjectsToolbar({
  filters,
  onFiltersChange,
  onCreateNew,
}: ProjectsToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFiltersChange({ ...filters, search: searchValue });
    },
    [filters, searchValue, onFiltersChange],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, sortBy: value as SortOption });
    },
    [filters, onFiltersChange],
  );

  const handleFilterChange = useCallback(
    (key: keyof ProjectFilters, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange],
  );

  const activeFilterCount = [
    filters.valuationMin,
    filters.valuationMax,
    filters.progressMin,
    filters.progressMax,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    onFiltersChange({
      ...filters,
      valuationMin: "",
      valuationMax: "",
      progressMin: "",
      progressMax: "",
    });
  }, [filters, onFiltersChange]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search projects…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-4"
        />
      </form>

      <div className="flex items-center gap-2 shrink-0">
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Sort
              <span className="text-muted-foreground text-xs">
                {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.sortBy}
              onValueChange={handleSortChange}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Filter projects</PopoverTitle>
            </PopoverHeader>
            <div className="space-y-4 pt-2">
              {/* Valuation range */}
              <fieldset>
                <legend className="text-sm font-medium mb-2">Valuation range</legend>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valuationMin}
                    onChange={(e) =>
                      handleFilterChange("valuationMin", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valuationMax}
                    onChange={(e) =>
                      handleFilterChange("valuationMax", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </fieldset>

              {/* Progress score range */}
              <fieldset>
                <legend className="text-sm font-medium mb-2">Progress score</legend>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    max={100}
                    value={filters.progressMin}
                    onChange={(e) =>
                      handleFilterChange("progressMin", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    max={100}
                    value={filters.progressMax}
                    onChange={(e) =>
                      handleFilterChange("progressMax", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </fieldset>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full gap-1.5 text-muted-foreground"
                >
                  <X className="size-3.5" />
                  Clear filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Create new */}
        <Button size="sm" onClick={onCreateNew} className="gap-1.5">
          <Plus className="size-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}

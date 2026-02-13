"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProjectsToolbar, ProjectsGrid } from "../components";
import { useProjects } from "../hooks/use-projects";
import {
  filtersFromParams,
  filtersToParams,
  type ProjectFilters,
  type Project,
} from "../types";

interface ProjectsViewProps {
  userName?: string | null;
}

export function ProjectsView({ userName }: ProjectsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { projects, isLoading, error, fetchProjects } = useProjects();

  // Derive filters from URL search params (single source of truth)
  const filters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams],
  );

  // Fetch whenever URL-derived filters change
  useEffect(() => {
    fetchProjects(filters);
  }, [filters, fetchProjects]);

  // Push filter changes to the URL (shallow navigation, no scroll reset)
  const handleFiltersChange = useCallback(
    (next: ProjectFilters) => {
      const qs = filtersToParams(next);
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname],
  );

  const handleCreateNew = useCallback(() => {
    router.push("/projects/new");
  }, [router]);

  const handleProjectClick = useCallback(
    (project: Project) => {
      router.push(`/projects/${project.id}`);
    },
    [router],
  );

  const greeting = userName ? `Hello, ${userName}` : "Welcome back";

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track your projects in one place.
        </p>
      </div>

      {/* Toolbar — search, sort, filter, create */}
      <ProjectsToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onCreateNew={handleCreateNew}
      />

      {/* Project card grid */}
      <ProjectsGrid
        projects={projects}
        isLoading={isLoading}
        error={error}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
}

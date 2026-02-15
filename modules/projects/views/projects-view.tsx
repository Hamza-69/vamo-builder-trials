"use client";

import { useCallback, useEffect, useState } from "react";
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
  const { projects, total, isLoading, error, fetchProjects } = useProjects();

  // Local state for filters — initialised from URL, then managed locally
  const [filters, setFilters] = useState<ProjectFilters>(() =>
    filtersFromParams(searchParams),
  );

  // Fetch whenever filters change
  useEffect(() => {
    fetchProjects(filters);
  }, [filters, fetchProjects]);

  // Sync URL when filters change (shallow — no server round-trip)
  useEffect(() => {
    const qs = filtersToParams(filters);
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
  }, [filters, pathname]);

  const handleFiltersChange = useCallback(
    (next: ProjectFilters) => {
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

      {/* Project card grid with pagination */}
      <ProjectsGrid
        projects={projects}
        total={total}
        page={filters.page}
        isLoading={isLoading}
        error={error}
        onProjectClick={handleProjectClick}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

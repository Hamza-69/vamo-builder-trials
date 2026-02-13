"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsToolbar, ProjectsGrid } from "../components";
import { useProjects } from "../hooks/use-projects";
import { DEFAULT_FILTERS, type ProjectFilters, type Project } from "../types";

interface ProjectsViewProps {
  userName?: string | null;
}

export function ProjectsView({ userName }: ProjectsViewProps) {
  const router = useRouter();
  const { projects, isLoading, error, fetchProjects } = useProjects();
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);

  // Fetch on mount and whenever filters change
  useEffect(() => {
    fetchProjects(filters);
  }, [filters, fetchProjects]);

  const handleFiltersChange = useCallback((next: ProjectFilters) => {
    setFilters(next);
  }, []);

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

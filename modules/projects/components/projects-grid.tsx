"use client";

import { FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "./project-card";
import type { Project } from "../types";

interface ProjectsGridProps {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  onProjectClick?: (project: Project) => void;
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProjectsGrid({
  projects,
  isLoading,
  error,
  onProjectClick,
}: ProjectsGridProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-destructive font-medium">Failed to load projects</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <FolderOpen className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No projects found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or create a new project.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={onProjectClick}
        />
      ))}
    </div>
  );
}

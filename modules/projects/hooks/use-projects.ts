"use client";

import { useCallback, useState } from "react";
import { useCsrf } from "@/hooks/use-csrf";
import type { Project, ProjectFilters } from "../types";

export function useProjects() {
  const { csrfFetch } = useCsrf();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(
    async (filters: ProjectFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters.search) params.set("search", filters.search);
        if (filters.sortBy) params.set("sortBy", filters.sortBy);
        if (filters.valuationMin) params.set("valuationMin", filters.valuationMin);
        if (filters.valuationMax) params.set("valuationMax", filters.valuationMax);
        if (filters.progressMin) params.set("progressMin", filters.progressMin);
        if (filters.progressMax) params.set("progressMax", filters.progressMax);

        const res = await csrfFetch(`/api/projects?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to fetch projects");
        }

        const { projects: data } = await res.json();
        setProjects(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [csrfFetch],
  );

  return { projects, isLoading, error, fetchProjects } as const;
}

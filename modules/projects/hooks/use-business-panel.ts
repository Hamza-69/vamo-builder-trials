"use client";

import { useCallback, useEffect, useState } from "react";
import { useCsrf } from "@/hooks/use-csrf";
import type { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export interface TractionSignal {
  id: string;
  signal_type: string;
  description: string;
  source: string;
  metadata: unknown;
  created_at: string | null;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string | null;
}

export interface BusinessPanelData {
  project: Project;
  tractionSignals: TractionSignal[];
  activityTimeline: TimelineEvent[];
  isOwner: boolean;
}

export function useBusinessPanel(projectId: string) {
  const { csrfFetch } = useCsrf();
  const [data, setData] = useState<BusinessPanelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/business`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch business data");
      }
      const result: BusinessPanelData = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Supabase Realtime subscription for activity_events
  useEffect(() => {
    const channel = supabase
      .channel(`business-panel-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_events",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Re-fetch all data when a new event is inserted
          fetchData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, fetchData]);

  // ── Mutations ──────────────────────────────────────────────

  const updateWhyBuilt = useCallback(
    async (whyBuilt: string) => {
      const res = await csrfFetch(`/api/projects/${projectId}/business/why-built`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ why_built: whyBuilt }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update");
      }

      await fetchData();
    },
    [projectId, csrfFetch, fetchData],
  );

  const updateProject = useCallback(
    async (fields: Record<string, unknown>) => {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          project: { ...prev.project, ...fields },
        };
      });

      const res = await csrfFetch(
        `/api/projects/${projectId}/business/update`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );

      if (!res.ok) {
        // Revert on failure by re-fetching
        await fetchData();
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update");
      }

      await fetchData();
    },
    [projectId, csrfFetch, fetchData],
  );

  const toggleVisibility = useCallback(
    async (field: string, value: boolean) => {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          project: { ...prev.project, [field]: value },
        };
      });

      const res = await csrfFetch(
        `/api/projects/${projectId}/business/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        },
      );

      if (!res.ok) {
        // Revert on failure
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            project: { ...prev.project, [field]: !value },
          };
        });
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update visibility");
      }
    },
    [projectId, csrfFetch],
  );

  const linkAsset = useCallback(
    async (type: "linkedin" | "github" | "website", url: string) => {
      const res = await csrfFetch(
        `/api/projects/${projectId}/business/link-asset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, url }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to link asset");
      }

      const result = await res.json();
      await fetchData();
      return result;
    },
    [projectId, csrfFetch, fetchData],
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    updateWhyBuilt,
    updateProject,
    toggleVisibility,
    linkAsset,
  } as const;
}

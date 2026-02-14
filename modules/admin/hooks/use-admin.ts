"use client";

import { useCallback, useState } from "react";
import { useCsrf } from "@/hooks/use-csrf";
import type {
  AdminStats,
  AdminUser,
  AdminUserDetail,
  AdminRedemption,
  AdminAnalyticsEvent,
  AdminProject,
} from "../types";

export function useAdmin() {
  const { csrfFetch } = useCsrf();

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // User Detail
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Redemptions
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  // Analytics
  const [analyticsEvents, setAnalyticsEvents] = useState<
    AdminAnalyticsEvent[]
  >([]);
  const [analyticsTotal, setAnalyticsTotal] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Projects
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Error
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (search?: string) => {
    setUsersLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const url = search
        ? `/api/admin/users?${params.toString()}`
        : "/api/admin/users";
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch users (${res.status})`);
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchUserDetail = useCallback(async (userId: string) => {
    setUserDetailLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user detail");
      const data = await res.json();
      setUserDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUserDetailLoading(false);
    }
  }, []);

  const fetchRedemptions = useCallback(async (status?: string) => {
    setRedemptionsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/redemptions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch redemptions");
      const data = await res.json();
      setRedemptions(data.redemptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRedemptionsLoading(false);
    }
  }, []);

  const updateRedemptionStatus = useCallback(
    async (id: string, status: "fulfilled" | "failed") => {
      setError(null);
      try {
        const res = await csrfFetch("/api/admin/redemptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error("Failed to update redemption");
        // Refresh
        await fetchRedemptions("pending");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [csrfFetch, fetchRedemptions]
  );

  const fetchAnalytics = useCallback(
    async (filters?: {
      eventName?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      perPage?: number;
    }) => {
      setAnalyticsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.eventName) params.set("eventName", filters.eventName);
        if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) params.set("dateTo", filters.dateTo);
        if (filters?.page) params.set("page", String(filters.page));
        if (filters?.perPage) params.set("perPage", String(filters.perPage));
        const res = await fetch(
          `/api/admin/analytics?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalyticsEvents(data.events);
        setAnalyticsTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setAnalyticsLoading(false);
      }
    },
    []
  );

  const fetchProjects = useCallback(
    async (filters?: {
      search?: string;
      status?: string;
      sortBy?: string;
      page?: number;
      perPage?: number;
    }) => {
      setProjectsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.search) params.set("search", filters.search);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.sortBy) params.set("sortBy", filters.sortBy);
        if (filters?.page) params.set("page", String(filters.page));
        if (filters?.perPage) params.set("perPage", String(filters.perPage));
        const res = await fetch(
          `/api/admin/projects?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data.projects);
        setProjectsTotal(data.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setProjectsLoading(false);
      }
    },
    []
  );

  return {
    stats,
    statsLoading,
    fetchStats,
    users,
    usersLoading,
    fetchUsers,
    userDetail,
    userDetailLoading,
    fetchUserDetail,
    redemptions,
    redemptionsLoading,
    fetchRedemptions,
    updateRedemptionStatus,
    analyticsEvents,
    analyticsTotal,
    analyticsLoading,
    fetchAnalytics,
    projects,
    projectsTotal,
    projectsLoading,
    fetchProjects,
    error,
  } as const;
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCsrf } from "@/hooks/use-csrf";

export type SortBy = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

interface WalletProfile {
  pineapple_balance: number | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface RewardEntry {
  id: string;
  event_type: string;
  reward_amount: number;
  balance_after: number;
  created_at: string | null;
  project_id: string | null;
  projects: { name: string } | null;
}

interface RedemptionEntry {
  id: string;
  amount: number;
  reward_type: string;
  status: string | null;
  created_at: string | null;
  fulfilled_at: string | null;
}

interface WalletData {
  profile: WalletProfile;
  rewards?: RewardEntry[];
  redemptions?: RedemptionEntry[];
  total: number;
  page: number;
  perPage: number;
}

export function useWallet() {
  const { csrfFetch } = useCsrf();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial state from URL search params
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [tableData, setTableData] = useState<{
    rewards?: RewardEntry[];
    redemptions?: RedemptionEntry[];
    total: number;
  }>({ total: 0 });
  const [profileLoading, setProfileLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive filter state from URL
  const tab = (searchParams.get("tab") as "rewards" | "redemptions") || "rewards";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const sortBy = (searchParams.get("sortBy") as SortBy) || "date_desc";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";

  const perPage = 20;

  // Helper to update URL search params without full page reload
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Setters that push to URL
  const setTab = useCallback(
    (t: "rewards" | "redemptions") => updateParams({ tab: t, page: null }),
    [updateParams]
  );
  const setPage = useCallback(
    (p: number) => updateParams({ page: p === 1 ? null : String(p) }),
    [updateParams]
  );
  const setSortBy = useCallback(
    (s: SortBy) => updateParams({ sortBy: s === "date_desc" ? null : s, page: null }),
    [updateParams]
  );
  const setMinAmount = useCallback(
    (v: string) => updateParams({ minAmount: v || null, page: null }),
    [updateParams]
  );
  const setMaxAmount = useCallback(
    (v: string) => updateParams({ maxAmount: v || null, page: null }),
    [updateParams]
  );

  // Fetch profile once on mount
  const profileFetched = useRef(false);
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/wallet?tab=rewards&page=1&perPage=1");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch profile");
      }
      const json = await res.json();
      setProfile(json.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profileFetched.current) {
      profileFetched.current = true;
      fetchProfile();
    }
  }, [fetchProfile]);

  // Fetch table data when filters change
  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        perPage: String(perPage),
        sortBy,
      });
      if (minAmount) params.set("minAmount", minAmount);
      if (maxAmount) params.set("maxAmount", maxAmount);

      const res = await fetch(`/api/wallet?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch wallet data");
      }
      const json: WalletData = await res.json();
      // Also update profile from table response to keep balance fresh
      setProfile(json.profile);
      setTableData({
        rewards: json.rewards,
        redemptions: json.redemptions,
        total: json.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTableLoading(false);
    }
  }, [tab, page, sortBy, minAmount, maxAmount]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const redeem = useCallback(
    async (amount: number, rewardType: string = "uber_eats") => {
      const res = await csrfFetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, rewardType }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Redemption failed");
      }

      // Refresh both profile and table
      await fetchTable();
      return json;
    },
    [csrfFetch, fetchTable]
  );

  return {
    profile,
    tableData,
    profileLoading,
    tableLoading,
    error,
    tab,
    setTab,
    page,
    setPage,
    sortBy,
    setSortBy,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    perPage,
    redeem,
    refetch: fetchTable,
  };
}

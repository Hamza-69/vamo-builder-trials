"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FolderKanban,
  MessageSquare,
  Trophy,
  Gift,
  Store,
} from "lucide-react";
import type { AdminStats } from "../types";

interface StatsGridProps {
  stats: AdminStats | null;
  loading: boolean;
  onLoad: () => void;
}

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    icon: Users,
  },
  {
    key: "totalProjects" as const,
    label: "Total Projects",
    icon: FolderKanban,
  },
  {
    key: "totalPrompts" as const,
    label: "Total Prompts Sent",
    icon: MessageSquare,
  },
  {
    key: "totalPineapplesEarned" as const,
    label: "Pineapples Earned",
    icon: Trophy,
  },
  {
    key: "totalPineapplesRedeemed" as const,
    label: "Pineapples Redeemed",
    icon: Gift,
  },
  {
    key: "activeListings" as const,
    label: "Active Listings",
    icon: Store,
  },
];

export function StatsGrid({ stats, loading, onLoad }: StatsGridProps) {
  useEffect(() => {
    onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-bold">
                  {stats?.[card.key]?.toLocaleString() ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

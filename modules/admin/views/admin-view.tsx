"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAdmin } from "../hooks/use-admin";
import { StatsGrid } from "../components/stats-grid";
import { UsersTable } from "../components/users-table";
import { UserDetailDialog } from "../components/user-detail-dialog";
import { RedemptionsTable } from "../components/redemptions-table";
import { AnalyticsTable } from "../components/analytics-table";
import { ProjectsTable } from "../components/projects-table";

const VALID_TABS = ["overview", "users", "redemptions", "analytics", "projects"] as const;
type AdminTab = (typeof VALID_TABS)[number];

export function AdminView() {
  const admin = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: AdminTab = VALID_TABS.includes(tabParam as AdminTab)
    ? (tabParam as AdminTab)
    : "overview";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const handleUserDetailClose = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, redemptions, analytics, and projects.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6">
          <StatsGrid
            stats={admin.stats}
            loading={admin.statsLoading}
            onLoad={admin.fetchStats}
          />
        </TabsContent>

        <TabsContent value="users" className="pt-6">
          <UsersTable
            users={admin.users}
            loading={admin.usersLoading}
            onFetch={admin.fetchUsers}
            onUserClick={handleUserClick}
          />
        </TabsContent>

        <TabsContent value="redemptions" className="pt-6">
          <RedemptionsTable
            redemptions={admin.redemptions}
            loading={admin.redemptionsLoading}
            onFetch={admin.fetchRedemptions}
            onUpdateStatus={admin.updateRedemptionStatus}
          />
        </TabsContent>

        <TabsContent value="analytics" className="pt-6">
          <AnalyticsTable
            events={admin.analyticsEvents}
            total={admin.analyticsTotal}
            loading={admin.analyticsLoading}
            onFetch={admin.fetchAnalytics}
          />
        </TabsContent>

        <TabsContent value="projects" className="pt-6">
          <ProjectsTable
            projects={admin.projects}
            loading={admin.projectsLoading}
            onFetch={admin.fetchProjects}
          />
        </TabsContent>
      </Tabs>

      {/* User detail dialog */}
      <UserDetailDialog
        userId={selectedUserId}
        detail={admin.userDetail}
        loading={admin.userDetailLoading}
        onFetch={admin.fetchUserDetail}
        onClose={handleUserDetailClose}
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUserDetail } from "../types";

interface UserDetailDialogProps {
  userId: string | null;
  detail: AdminUserDetail | null;
  loading: boolean;
  onFetch: (userId: string) => void;
  onClose: () => void;
}

export function UserDetailDialog({
  userId,
  detail,
  loading,
  onFetch,
  onClose,
}: UserDetailDialogProps) {
  useEffect(() => {
    if (userId) {
      onFetch(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loading
              ? "Loading..."
              : detail?.profile?.full_name ??
                detail?.profile?.email ??
                "User Detail"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Profile info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                {detail.profile.email}
              </div>
              <div>
                <span className="text-muted-foreground">Balance:</span>{" "}
                {detail.profile.pineapple_balance?.toLocaleString() ?? 0} 🍍
              </div>
              <div>
                <span className="text-muted-foreground">Joined:</span>{" "}
                {detail.profile.created_at
                  ? new Date(detail.profile.created_at).toLocaleDateString()
                  : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Admin:</span>{" "}
                {detail.profile.is_admin ? "Yes" : "No"}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Projects ({detail.projects.length})
              </h3>
              {detail.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.projects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {p.progress_score ?? 0}%
                          </TableCell>
                          <TableCell>
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Recent Activity ({detail.activity.length})
              </h3>
              {detail.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.activity.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Badge variant="secondary">{a.event_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {a.description ?? "—"}
                          </TableCell>
                          <TableCell>
                            {a.created_at
                              ? new Date(a.created_at).toLocaleDateString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

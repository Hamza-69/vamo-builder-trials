"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { AdminRedemption } from "../types";

interface RedemptionsTableProps {
  redemptions: AdminRedemption[];
  loading: boolean;
  onFetch: (status?: string) => void;
  onUpdateStatus: (id: string, status: "fulfilled" | "failed") => Promise<void>;
}

export function RedemptionsTable({
  redemptions,
  loading,
  onFetch,
  onUpdateStatus,
}: RedemptionsTableProps) {
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    onFetch(statusFilter === "all" ? "all" : statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAction = async (
    id: string,
    status: "fulfilled" | "failed"
  ) => {
    try {
      await onUpdateStatus(id, status);
      toast.success(
        `Redemption marked as ${status}.`
      );
    } catch {
      toast.error("Failed to update redemption.");
    }
  };

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="fulfilled">Fulfilled</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Email</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Reward Type</TableHead>
            <TableHead>Requested Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : redemptions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No pending redemptions.
              </TableCell>
            </TableRow>
          ) : (
            redemptions.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.profiles?.email ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.amount.toLocaleString()} 🍍
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{r.reward_type}</Badge>
                </TableCell>
                <TableCell>
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "pending"
                        ? "secondary"
                        : r.status === "fulfilled"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "fulfilled")}
                      >
                        <CheckCircle className="size-3.5 mr-1" />
                        Fulfill
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "failed")}
                      >
                        <XCircle className="size-3.5 mr-1" />
                        Fail
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

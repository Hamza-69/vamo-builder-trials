"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, SlidersHorizontal, Wallet, Gift } from "lucide-react";
import type { SortBy } from "../hooks/use-wallet";

/* ----------- Shared Types ----------- */

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

/* ----------- Helpers ----------- */

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadge(status: string | null) {
  switch (status) {
    case "fulfilled":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15">
          Fulfilled ✓
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25 hover:bg-red-500/15">
          Failed ✗
        </Badge>
      );
    case "pending":
    default:
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15">
          Pending ⏳
        </Badge>
      );
  }
}

/* ----------- Rewards Table ----------- */

function RewardsTable({ rewards }: { rewards: RewardEntry[] }) {
  if (rewards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <Wallet className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No reward history yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Earn pineapples by building your projects and completing milestones.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Project</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rewards.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDate(entry.created_at)}</TableCell>
            <TableCell>{formatEventType(entry.event_type)}</TableCell>
            <TableCell className="text-muted-foreground">
              {entry.projects?.name ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums font-medium">
              <span
                className={
                  entry.reward_amount >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {entry.reward_amount >= 0 ? "+" : ""}
                {entry.reward_amount} 🍍
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {entry.balance_after} 🍍
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ----------- Redemptions Table ----------- */

function RedemptionsTable({
  redemptions,
}: {
  redemptions: RedemptionEntry[];
}) {
  if (redemptions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <Gift className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No redemptions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Redeem your pineapples for rewards once you reach the minimum balance.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Reward Type</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {redemptions.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDate(entry.created_at)}</TableCell>
            <TableCell className="text-right tabular-nums font-medium">
              {entry.amount} 🍍
            </TableCell>
            <TableCell>{formatEventType(entry.reward_type)}</TableCell>
            <TableCell>{statusBadge(entry.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ----------- Pagination Controls ----------- */

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build page numbers to show
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => onPageChange(p)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={
              page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/* ----------- Main History Table ----------- */

/* ----------- Table Skeleton ----------- */

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <TableCell key={c}>
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface WalletHistoryTableProps {
  tab: "rewards" | "redemptions";
  setTab: (t: "rewards" | "redemptions") => void;
  rewards?: RewardEntry[];
  redemptions?: RedemptionEntry[];
  total: number;
  page: number;
  perPage: number;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  setPage: (p: number) => void;
  minAmount: string;
  maxAmount: string;
  setMinAmount: (v: string) => void;
  setMaxAmount: (v: string) => void;
  loading?: boolean;
}

export function WalletHistoryTable({
  tab,
  setTab,
  rewards,
  redemptions,
  total,
  page,
  perPage,
  sortBy,
  setSortBy,
  setPage,
  minAmount,
  maxAmount,
  setMinAmount,
  setMaxAmount,
  loading,
}: WalletHistoryTableProps) {
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Toolbar: Tabs + Sort + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button
            size="sm"
            variant={tab === "rewards" ? "default" : "ghost"}
            onClick={() => setTab("rewards")}
            className="text-xs"
          >
            Reward History
          </Button>
          <Button
            size="sm"
            variant={tab === "redemptions" ? "default" : "ghost"}
            onClick={() => setTab("redemptions")}
            className="text-xs"
          >
            Redemptions
          </Button>
        </div>

        {/* Sort + Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest first</SelectItem>
                <SelectItem value="date_asc">Oldest first</SelectItem>
                <SelectItem value="amount_desc">Highest amount</SelectItem>
                <SelectItem value="amount_asc">Lowest amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-8 w-20 text-xs"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="h-8 w-20 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {loading ? (
          <TableSkeleton columns={tab === "rewards" ? 5 : 4} />
        ) : tab === "rewards" ? (
          <RewardsTable rewards={rewards ?? []} />
        ) : (
          <RedemptionsTable redemptions={redemptions ?? []} />
        )}
      </div>

      {/* Pagination */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Summary */}
      {total > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of{" "}
          {total} entries
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminAnalyticsEvent } from "../types";

interface AnalyticsTableProps {
  events: AdminAnalyticsEvent[];
  total: number;
  loading: boolean;
  onFetch: (filters?: {
    eventName?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
  }) => void;
}

const PER_PAGE = 25;

export function AnalyticsTable({
  events,
  total,
  loading,
  onFetch,
}: AnalyticsTableProps) {
  const [eventName, setEventName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchWithFilters = useCallback(
    (p?: number) => {
      const currentPage = p ?? page;
      onFetch({
        eventName: eventName || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: currentPage,
        perPage: PER_PAGE,
      });
    },
    [eventName, dateFrom, dateTo, page, onFetch]
  );

  useEffect(() => {
    fetchWithFilters(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchWithFilters(newPage);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filter by event name..."
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            From
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            To
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No analytics events found.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant="secondary">{event.event_name}</Badge>
                  </TableCell>
                  <TableCell>
                    {event.profiles?.email ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {event.properties
                      ? JSON.stringify(event.properties)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {event.created_at
                      ? new Date(event.created_at).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounce";
import type { AdminProject } from "../types";

const ADMIN_PROJECTS_PER_PAGE = 20;

interface ProjectsTableProps {
  projects: AdminProject[];
  total: number;
  page: number;
  loading: boolean;
  onFetch: (filters?: {
    search?: string;
    status?: string;
    sortBy?: string;
    page?: number;
    perPage?: number;
  }) => void;
  onPageChange?: (page: number) => void;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "progress_desc", label: "Progress (High)" },
  { value: "progress_asc", label: "Progress (Low)" },
];

export function ProjectsTable({
  projects,
  total,
  page,
  loading,
  onFetch,
  onPageChange,
}: ProjectsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / ADMIN_PROJECTS_PER_PAGE);

  useEffect(() => {
    onFetch({
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      sortBy,
      page,
      perPage: ADMIN_PROJECTS_PER_PAGE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, sortBy, page]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      onPageChange?.(1);
    },
    [onPageChange]
  );

  const statusBadgeVariant = (s: string | null) => {
    switch (s) {
      case "active":
        return "default" as const;
      case "listed":
        return "secondary" as const;
      case "sold":
        return "outline" as const;
      case "archived":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); onPageChange?.(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); onPageChange?.(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    {project.profiles?.full_name ??
                      project.profiles?.email ??
                      "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(project.status)}>
                      {project.status ?? "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {project.progress_score ?? 0}%
                  </TableCell>
                  <TableCell>
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString()
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-[36px]"
                    onClick={() => onPageChange?.(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

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
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounce";
import type { AdminProject } from "../types";

interface ProjectsTableProps {
  projects: AdminProject[];
  loading: boolean;
  onFetch: (filters?: {
    search?: string;
    status?: string;
    sortBy?: string;
  }) => void;
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
  loading,
  onFetch,
}: ProjectsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    onFetch({
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      sortBy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, sortBy]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
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
        <Select value={status} onValueChange={setStatus}>
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
        <Select value={sortBy} onValueChange={setSortBy}>
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
    </div>
  );
}

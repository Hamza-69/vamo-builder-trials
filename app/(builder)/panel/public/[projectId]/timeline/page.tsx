"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  Users,
  BadgeDollarSign,
  Linkedin,
  Github,
  Globe,
  Clock,
  MessageSquare,
  Zap,
  CheckCircle2,
  ShoppingCart,
  Star,
  Gift,
  Ticket,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ───────────── Types ───────────── */

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string | null;
}

interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
  page: number;
  perPage: number;
  projectName: string;
}

/* ───────────── Helpers ───────────── */

function getEventIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    feature_shipped: <Rocket className="size-4 text-green-500" />,
    customer_added: <Users className="size-4 text-blue-500" />,
    revenue_logged: <BadgeDollarSign className="size-4 text-emerald-500" />,
    prompt: <MessageSquare className="size-4 text-muted-foreground" />,
    update: <Zap className="size-4 text-yellow-500" />,
    link_linkedin: <Linkedin className="size-4 text-blue-600" />,
    link_github: <Github className="size-4 text-foreground" />,
    link_website: <Globe className="size-4 text-purple-500" />,
    listing_created: <ShoppingCart className="size-4 text-indigo-500" />,
    offer_received: <Star className="size-4 text-amber-500" />,
    reward_earned: <Gift className="size-4 text-pink-500" />,
    reward_redeemed: <Ticket className="size-4 text-orange-500" />,
    project_created: <CheckCircle2 className="size-4 text-green-600" />,
  };
  return map[type] ?? <Clock className="size-4 text-muted-foreground" />;
}

function getEventLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTimestamp(dateStr: string | null): { relative: string; full: string } {
  if (!dateStr) return { relative: "", full: "" };
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  let relative: string;
  if (mins < 1) relative = "just now";
  else if (mins < 60) relative = `${mins}m ago`;
  else if (hrs < 24) relative = `${hrs}h ago`;
  else if (days < 30) relative = `${days}d ago`;
  else relative = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const full = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return { relative, full };
}

const PER_PAGE = 20;

/* ═══════════════════════════════════════════════════════
   Timeline Page
   ═══════════════════════════════════════════════════════ */

export default function TimelinePage({
  params,
}: {
  params: { projectId: string };
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [projectName, setProjectName] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        const res = await fetch(
          `/api/projects/${params.projectId}/business/timeline?page=${pageNum}&perPage=${PER_PAGE}`,
        );

        if (!res.ok) {
          setError(res.status === 404 ? "Project not found." : "Failed to load timeline.");
          return;
        }

        const data: TimelineResponse = await res.json();
        setProjectName(data.projectName);
        setTotal(data.total);
        setPage(data.page);
        setEvents((prev) => (append ? [...prev, ...data.events] : data.events));
      } catch {
        setError("Something went wrong.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [params.projectId],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const hasMore = events.length < total;

  /* Loading */
  if (isLoading) return <TimelineSkeleton />;

  /* Error */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 space-y-4">
          <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Clock className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">{error}</h1>
          <Link href={`/panel/public/${params.projectId}`}>
            <Button variant="outline" className="gap-2 mt-2">
              <ArrowLeft className="size-4" />
              Back to Panel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/panel/public/${params.projectId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Panel</span>
          </Link>
          <Link href="/" className="font-semibold text-sm">
            Vamo
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Activity Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projectName ? `All activity for ${projectName}` : "Full project activity log"}
            <span className="text-xs ml-2">
              ({total} event{total !== 1 ? "s" : ""})
            </span>
          </p>
        </div>

        {/* Events */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="size-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Continuous vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0">
              {events.map((ev) => {
                const ts = formatTimestamp(ev.created_at);
                return (
                  <div key={ev.id} className="flex gap-4 relative group">
                    {/* Dot */}
                    <div className="relative z-10 mt-1 shrink-0 flex items-center justify-center size-8 rounded-full bg-card border shadow-sm">
                      {getEventIcon(ev.event_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6 min-w-0">
                      <div className="rounded-lg border bg-card p-4 shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {ev.description || getEventLabel(ev.event_type)}
                            </p>
                            <Badge variant="secondary" className="text-[10px] mt-1.5">
                              {getEventLabel(ev.event_type)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums" title={ts.full}>
                            {ts.relative}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4 relative z-10">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isLoadingMore}
                  onClick={() => fetchPage(page + 1, true)}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>Load more</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Powered by Vamo</span>
          <Link href="/marketplace" className="hover:text-foreground transition-colors">
            Explore Marketplace →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ─── Skeleton ─── */

function TimelineSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16" />
          <div className="w-20" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <Skeleton className="h-20 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

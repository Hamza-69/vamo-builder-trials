"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DollarSign,
  Lightbulb,
  TrendingUp,
  Rocket,
  Users,
  BadgeDollarSign,
  Linkedin,
  Github,
  Globe,
  Clock,
  ExternalLink,
  Award,
  Zap,
  CheckCircle2,
  MessageSquare,
  ShoppingCart,
  Star,
  Gift,
  Ticket,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ───────────── Types ───────────── */

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  progress_score: number | null;
  valuation_low: number | null;
  valuation_high: number | null;
  why_built: string | null;
  status: string | null;
  created_at: string | null;
  is_valuation_shown: boolean;
  is_why_shown: boolean;
  is_progress_shown: boolean;
  is_traction_shown: boolean;
  is_links_shown: boolean;
  is_activity_timeline_shown: boolean;
}

interface TractionSignal {
  id: string;
  signal_type: string;
  description: string;
  source: string;
  created_at: string | null;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string | null;
}

interface BusinessData {
  project: ProjectData;
  tractionSignals: TractionSignal[];
  activityTimeline: TimelineEvent[];
  isOwner: boolean;
}

/* ───────────── Helpers ───────────── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getProgressLabel(score: number): string {
  if (score <= 25) return "Early Stage";
  if (score <= 50) return "Building";
  if (score <= 75) return "Traction";
  return "Growth";
}

function getProgressColor(score: number): string {
  if (score <= 25) return "text-red-500";
  if (score <= 50) return "text-yellow-500";
  if (score <= 75) return "text-green-500";
  return "text-blue-500";
}

function getProgressBgLight(score: number): string {
  if (score <= 25) return "bg-red-500/10";
  if (score <= 50) return "bg-yellow-500/10";
  if (score <= 75) return "bg-green-500/10";
  return "bg-blue-500/10";
}

function getEventIcon(eventType: string) {
  const map: Record<string, React.ReactNode> = {
    feature_shipped: <Rocket className="size-3.5 text-green-500" />,
    customer_added: <Users className="size-3.5 text-blue-500" />,
    revenue_logged: <BadgeDollarSign className="size-3.5 text-emerald-500" />,
    prompt: <MessageSquare className="size-3.5 text-muted-foreground" />,
    update: <Zap className="size-3.5 text-yellow-500" />,
    link_linkedin: <Linkedin className="size-3.5 text-blue-600" />,
    link_github: <Github className="size-3.5 text-foreground" />,
    link_website: <Globe className="size-3.5 text-purple-500" />,
    listing_created: <ShoppingCart className="size-3.5 text-indigo-500" />,
    offer_received: <Star className="size-3.5 text-amber-500" />,
    reward_earned: <Gift className="size-3.5 text-pink-500" />,
    reward_redeemed: <Ticket className="size-3.5 text-orange-500" />,
    project_created: <CheckCircle2 className="size-3.5 text-green-600" />,
  };
  return map[eventType] ?? <Clock className="size-3.5 text-muted-foreground" />;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════ */

export default function PanelPublicPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [data, setData] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${params.projectId}/business`);
        if (!res.ok) {
          setError(res.status === 404 ? "Project not found or not publicly available." : "Failed to load project data.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.projectId]);

  /* Loading */
  if (isLoading) return <PublicPanelSkeleton />;

  /* Error / not found */
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Globe className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">{error ?? "Not found"}</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This project may not exist or isn&apos;t publicly visible yet.
          </p>
          <Link href="/marketplace">
            <Button variant="outline" className="gap-2 mt-2">
              <ArrowLeft className="size-4" />
              Go to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { project, tractionSignals, activityTimeline } = data;

  /* Collect visible linked assets */
  const linkedAssets = [
    { label: "LinkedIn", icon: <Linkedin className="size-4" />, url: project.linkedin_url, color: "text-blue-600 bg-blue-500/10" },
    { label: "GitHub", icon: <Github className="size-4" />, url: project.github_url, color: "text-foreground bg-foreground/5" },
    { label: "Website", icon: <Globe className="size-4" />, url: project.url, color: "text-purple-500 bg-purple-500/10" },
  ].filter((a) => a.url);

  const hasAnySidebar =
    (project.is_links_shown && linkedAssets.length > 0) ||
    project.is_activity_timeline_shown;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top bar ─── */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors justify-self-start"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Marketplace</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 font-semibold text-sm">
            <Image src="/icon.svg" alt="Vamo" width={20} height={20} />
            Vamo
          </Link>
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ─── Hero ─── */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {project.status && (
                  <Badge variant="outline" className="capitalize text-xs">
                    {project.status}
                  </Badge>
                )}
                {project.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(project.created_at)}
                  </span>
                )}
              </div>
            </div>

            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <ExternalLink className="size-3.5" />
                  Visit Site
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div
          className={cn(
            "grid gap-6",
            hasAnySidebar ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 max-w-2xl",
          )}
        >
          {/* Main column */}
          <div className={cn(hasAnySidebar ? "md:col-span-2" : "", "space-y-6")}>
            {/* Valuation */}
            {project.is_valuation_shown && (
              <Card className="bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5">
                <CardHeader icon={<DollarSign className="size-5 text-green-500" />} title="Estimated Valuation" />
                <div className="p-5">
                  {(project.valuation_low ?? 0) > 0 || (project.valuation_high ?? 0) > 0 ? (
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
                      {formatCurrency(project.valuation_low ?? 0)} – {formatCurrency(project.valuation_high ?? 0)}
                    </p>
                  ) : (
                    <Badge variant="secondary">Not yet estimated</Badge>
                  )}
                </div>
              </Card>
            )}

            {/* Why I Built This */}
            {project.is_why_shown && project.why_built && (
              <Card>
                <CardHeader icon={<Lightbulb className="size-5 text-yellow-500" />} title="Why I Built This" />
                <div className="p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {project.why_built}
                  </p>
                </div>
              </Card>
            )}

            {/* Progress */}
            {project.is_progress_shown && <ProgressCard score={project.progress_score} />}

            {/* Traction Signals */}
            {project.is_traction_shown && (
              <Card>
                <CardHeader icon={<TrendingUp className="size-5 text-emerald-500" />} title="Traction Signals" />
                <div className="p-5">
                  {tractionSignals.length === 0 ? (
                    <EmptyState icon={<Award className="size-10" />} message="No traction signals yet." />
                  ) : (
                    <div className="space-y-2">
                      {tractionSignals.map((s) => (
                        <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                          <span className="mt-0.5 shrink-0">{getEventIcon(s.signal_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{s.description || s.signal_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(s.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          {hasAnySidebar && (
            <div className="space-y-6">
              {/* Linked Assets */}
              {project.is_links_shown && linkedAssets.length > 0 && (
                <Card>
                  <CardHeader icon={<ExternalLink className="size-5 text-indigo-500" />} title="Links" />
                  <div className="p-4 space-y-1">
                    {linkedAssets.map((a) => (
                      <a
                        key={a.label}
                        href={a.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className={cn("p-2 rounded-lg shrink-0", a.color)}>{a.icon}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.url}</p>
                        </div>
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Timeline */}
              {project.is_activity_timeline_shown && (
                <Card>
                  <CardHeader icon={<Clock className="size-5 text-blue-500" />} title="Recent Activity" />
                  <div className="p-5">
                    {activityTimeline.length === 0 ? (
                      <EmptyState icon={<Clock className="size-8" />} message="No activity yet." small />
                    ) : (
                      <>
                        <div className="space-y-0">
                          {activityTimeline.map((ev, i) => (
                            <div key={ev.id} className="flex gap-3 relative">
                              {i < activityTimeline.length - 1 && (
                                <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
                              )}
                              <div className="relative z-10 mt-0.5 shrink-0 flex items-center justify-center size-5 rounded-full bg-muted">
                                {getEventIcon(ev.event_type)}
                              </div>
                              <div className="flex-1 pb-3 min-w-0">
                                <p className="text-sm leading-snug">
                                  {ev.description || ev.event_type.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-muted-foreground">{relativeTime(ev.created_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link
                          href={`/panel/public/${params.projectId}/timeline`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
                        >
                          View full timeline <ExternalLink className="size-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">Powered by <Image src="/icon.svg" alt="Vamo" width={14} height={14} /> <span className="font-medium text-foreground">Vamo</span></span>
          <Link href="/marketplace" className="hover:text-foreground transition-colors">
            Explore Marketplace →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ═════════════════════════════════════════════════════
   Shared local sub-components
   ═════════════════════════════════════════════════════ */

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", className)}>{children}</div>;
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b bg-muted/30">
      {icon}
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function EmptyState({ icon, message, small }: { icon: React.ReactNode; message: string; small?: boolean }) {
  return (
    <div className={cn("text-center", small ? "py-4" : "py-6")}>
      <div className={cn("mx-auto text-muted-foreground/30 mb-2", small ? "" : "mb-3")}>{icon}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ProgressCard({ score }: { score: number | null }) {
  const s = score ?? 0;
  return (
    <Card>
      <CardHeader icon={<TrendingUp className="size-5 text-blue-500" />} title="Progress" />
      <div className="p-5">
        <div className="flex items-center gap-5">
          {/* Circular progress ring */}
          <div className={cn("relative size-20 rounded-full flex items-center justify-center", getProgressBgLight(s))}>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-muted" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                strokeWidth="6"
                strokeDasharray={`${(s / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-700",
                  s <= 25 && "stroke-red-500",
                  s > 25 && s <= 50 && "stroke-yellow-500",
                  s > 50 && s <= 75 && "stroke-green-500",
                  s > 75 && "stroke-blue-500",
                )}
              />
            </svg>
            <span className={cn("text-xl font-bold tabular-nums relative z-10", getProgressColor(s))}>{s}</span>
          </div>
          <div>
            <Badge variant="outline" className={cn("text-xs mb-1", getProgressColor(s))}>
              {getProgressLabel(s)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Skeleton ─── */
function PublicPanelSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
          <div className="w-20" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

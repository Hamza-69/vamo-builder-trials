"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Globe,
  MessageSquare,
  TrendingUp,
  Zap,
  Calendar,
  User,
  AlertTriangle,
  X,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCsrf } from "@/hooks/use-csrf";
import { toast } from "sonner";
import type { ListingDetail, ListingMetrics, TimelineEvent } from "../types";

interface ListingDetailViewProps {
  listing: ListingDetail;
  isOwner?: boolean;
}

export function ListingDetailView({ listing, isOwner = false }: ListingDetailViewProps) {
  const initialScreenshots = (listing.screenshots as string[] | null) ?? [];
  const [screenshots, setScreenshots] = useState<string[]>(initialScreenshots);
  const { csrfFetch } = useCsrf();
  const metrics = (listing.metrics as ListingMetrics | null) ?? {
    progress_score: listing.projects?.progress_score ?? 0,
    prompt_count: 0,
    traction_signals: 0,
    timeline_snapshot: [],
  };
  const timelineSnapshot: TimelineEvent[] = metrics.timeline_snapshot ?? [];
  const defaultHero = screenshots[0] ?? listing.projects?.screenshot_url;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const heroImage = selectedImage ?? defaultHero;

  const removeScreenshot = async (urlToRemove: string) => {
    const updated = screenshots.filter((u) => u !== urlToRemove);
    try {
      const res = await csrfFetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          screenshots: updated,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove screenshot");
      }
      setScreenshots(updated);
      if (selectedImage === urlToRemove) {
        setSelectedImage(null);
      }
      toast.success("Screenshot removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove screenshot"
      );
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-8">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left column: image + description */}
        <div className="space-y-6">
          {/* Main image */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted border">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 720px"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Globe className="size-12 opacity-30" />
              </div>
            )}
          </div>

          {/* Screenshot gallery */}
          {screenshots.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {screenshots.map((url, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(url)}
                    className={`relative shrink-0 size-20 rounded-md overflow-hidden bg-muted border-2 transition-colors ${heroImage === url
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/40"
                      }`}
                  >
                    <Image
                      src={url}
                      alt={`Screenshot ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeScreenshot(url)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.description || "No description provided."}
            </p>
          </div>

          <Separator />

          {/* Timeline snapshot */}
          {timelineSnapshot.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Activity Timeline</h2>
                <Badge variant="secondary" className="text-xs">
                  {timelineSnapshot.length} events
                </Badge>
              </div>
              <div className="rounded-lg border divide-y">
                {timelineSnapshot.map((event) => (
                  <div
                    key={event.id}
                    className="px-4 py-3 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {event.event_type.replace(/_/g, " ")}
                      </Badge>
                      {event.description && (
                        <span className="text-muted-foreground truncate">
                          {event.description}
                        </span>
                      )}
                    </div>
                    {event.created_at && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {listing.last_timeline_item_id && (
                <p className="text-xs text-muted-foreground">
                  Snapshot up to event:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                    {listing.last_timeline_item_id.slice(0, 8)}…
                  </code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column: sidebar info */}
        <div className="space-y-5">
          {/* Title & price */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {listing.title}
            </h1>
            {listing.is_outdated && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This listing may be outdated — new activity has occurred since it was published.
                </p>
              </div>
            )}
            {(listing.asking_price_low != null ||
              listing.asking_price_high != null) && (
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="size-5 text-primary" />
                  {listing.asking_price_low != null &&
                    listing.asking_price_high != null
                    ? `$${listing.asking_price_low.toLocaleString()} – $${listing.asking_price_high.toLocaleString()}`
                    : listing.asking_price_low != null
                      ? `From $${listing.asking_price_low.toLocaleString()}`
                      : `Up to $${listing.asking_price_high!.toLocaleString()}`}
                </div>
              )}
          </div>

          <Separator />

          {/* Metrics cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-0">
              <CardContent className="p-3 text-center">
                <TrendingUp className="size-4 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">
                  {metrics.progress_score}%
                </p>
                <p className="text-[10px] text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardContent className="p-3 text-center">
                <MessageSquare className="size-4 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{metrics.prompt_count}</p>
                <p className="text-[10px] text-muted-foreground">Prompts</p>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardContent className="p-3 text-center">
                <Zap className="size-4 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">
                  {metrics.traction_signals}
                </p>
                <p className="text-[10px] text-muted-foreground">Traction</p>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="secondary"
            className="w-full gap-2"
            size="lg"
            asChild
          >
            <a
              href={`/panel/public/${listing.project_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Users className="size-4" />
              Business Panel
            </a>
          </Button>

          <Separator />

          {/* Seller info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Seller</h3>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                {listing.profiles?.avatar_url ? (
                  <Image
                    src={listing.profiles.avatar_url}
                    alt="Seller"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="size-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {listing.profiles?.full_name ?? "Anonymous"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Listing meta */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>
                Listed{" "}
                {listing.created_at
                  ? new Date(listing.created_at).toLocaleDateString()
                  : "recently"}
              </span>
            </div>
            {listing.projects?.url && (
              <div className="flex items-center gap-2">
                <Globe className="size-4" />
                <a
                  href={listing.projects.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors truncate"
                >
                  {listing.projects.url
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

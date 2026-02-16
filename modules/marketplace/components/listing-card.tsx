"use client";

import Image from "next/image";
import { Globe, ExternalLink, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ListingWithProject } from "../types";

interface ListingCardProps {
  listing: ListingWithProject;
  onClick?: (listing: ListingWithProject) => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const screenshots = (listing.screenshots as string[] | null) ?? [];
  const thumbnailUrl = screenshots[0] ?? listing.projects?.screenshot_url;
  const hasUrl = !!listing.projects?.url;
  const displayUrl = listing.projects?.url
    ? listing.projects.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  const metrics = listing.metrics as Record<string, unknown> | null;
  const progressScore =
    (metrics?.progress_score as number) ??
    listing.projects?.progress_score ??
    0;

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md hover:border-primary/30 p-0 gap-0"
      onClick={() => onClick?.(listing)}
    >
      {/* Preview area */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`${listing.title} preview`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : hasUrl ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Globe className="size-8 opacity-40" />
            <span className="text-xs truncate max-w-[80%]">{displayUrl}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Globe className="size-8 opacity-30" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-200" />
      </div>

      {/* Info */}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {listing.is_outdated && (
            <Badge variant="outline" className="text-xs gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
              <AlertTriangle className="size-3" />
              Outdated
            </Badge>
          )}
          {(listing.asking_price_low != null ||
            listing.asking_price_high != null) && (
            <Badge variant="outline" className="text-xs gap-1">
              <DollarSign className="size-3" />
              {listing.asking_price_low != null &&
              listing.asking_price_high != null
                ? `$${listing.asking_price_low.toLocaleString()} – $${listing.asking_price_high.toLocaleString()}`
                : listing.asking_price_low != null
                  ? `From $${listing.asking_price_low.toLocaleString()}`
                  : `Up to $${listing.asking_price_high!.toLocaleString()}`}
            </Badge>
          )}
          {progressScore > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <TrendingUp className="size-3" />
              {progressScore}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

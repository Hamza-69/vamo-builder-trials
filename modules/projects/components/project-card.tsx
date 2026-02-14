"use client";

import Image from "next/image";
import { Globe, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const hasScreenshot = !!project.screenshot_url;
  const hasUrl = !!project.url;
  const displayUrl = project.url
    ? project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md hover:border-primary/30 p-0 gap-0"
      onClick={() => onClick?.(project)}
    >
      {/* Preview area */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {hasScreenshot ? (
          <Image
            src={project.screenshot_url!}
            alt={`${project.name} preview`}
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
            {project.name}
          </h3>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {project.progress_score != null && (
            <Badge variant="secondary" className="text-xs">
              Progress: {project.progress_score}%
            </Badge>
          )}
          {(project.valuation_low != null && project.valuation_high != null && project.valuation_low.toLocaleString() != "0" && project.valuation_high.toLocaleString() != "0") && (
            <Badge variant="outline" className="text-xs">
              {project.valuation_low != null && project.valuation_high != null
                ? `$${project.valuation_low.toLocaleString()} – $${project.valuation_high.toLocaleString()}`
                : project.valuation_low != null
                  ? `From $${project.valuation_low.toLocaleString()}`
                  : `Up to $${project.valuation_high!.toLocaleString()}`}
            </Badge>
          )}
          {project.status && (
            <Badge variant="outline" className="text-xs capitalize">
              {project.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import {
  ImagePlus,
  Loader2,
  TrendingUp,
  MessageSquare,
  Zap,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCsrf } from "@/hooks/use-csrf";
import { createClient } from "@/utils/supabase/client";
import { generateListingDescription } from "../utils/generate-description";
import { toast } from "sonner";
import type { TimelineEvent } from "../types";

interface CreateListingDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When relisting, pass the screenshots from the old listing */
  existingScreenshots?: string[];
  /** Whether this is a relist (archive old listing + create new) */
  isRelist?: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  valuation_low: number | null;
  valuation_high: number | null;
  progress_score: number | null;
}

export function CreateListingDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  existingScreenshots,
  isRelist = false,
}: CreateListingDialogProps) {
  const supabase = createClient();
  const { csrfFetch } = useCsrf();

  // ── Form state ──────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceLow, setPriceLow] = useState<number>(0);
  const [priceHigh, setPriceHigh] = useState<number>(0);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // ── Preview data ────────────────────────────────────────────
  const [project, setProject] = useState<ProjectData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [promptCount, setPromptCount] = useState(0);
  const [tractionSignals, setTractionSignals] = useState(0);

  // ── UI state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch project data and activity events on open ──────────
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch project
        const { data: proj } = await supabase
          .from("projects")
          .select(
            "id, name, description, valuation_low, valuation_high, progress_score",
          )
          .eq("id", projectId)
          .single();

        if (proj) {
          setProject(proj);
          setTitle(proj.name);
          setDescription(
            generateListingDescription(proj.name, proj.description),
          );
          setPriceLow(proj.valuation_low ?? 0);
          setPriceHigh(proj.valuation_high ?? 0);
        }

        // Fetch activity events for timeline snapshot
        const { data: events } = await supabase
          .from("activity_events")
          .select("id, event_type, description, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (events) {
          setTimeline(events);
          setPromptCount(
            events.filter((e) => e.event_type === "prompt").length,
          );
          setTractionSignals(
            events.filter((e) =>
              ["customer_added", "revenue_logged", "feature_shipped"].includes(
                e.event_type,
              ),
            ).length,
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Pre-populate with existing screenshots on relist, otherwise reset
    setScreenshots(existingScreenshots?.slice(0, 5) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  // ── Screenshot upload ───────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: Invalid type. Use JPEG, PNG, WebP, or GIF.`);
          continue;
        }
        if (file.size > maxSize) {
          toast.error(`${file.name}: Too large. Max 5MB.`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const path = `${user.id}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("listings")
          .upload(path, file, { upsert: true });

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("listings").getPublicUrl(path);

        uploaded.push(publicUrl);
      }

      setScreenshots((prev) => {
        const combined = [...prev, ...uploaded];
        if (combined.length > 5) {
          toast.error("Maximum 5 screenshots allowed");
          return combined.slice(0, 5);
        }
        return combined;
      });

      if (uploaded.length > 0) {
        toast.success(
          `${uploaded.length} screenshot${uploaded.length > 1 ? "s" : ""} uploaded`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload screenshots",
      );
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Publish listing ─────────────────────────────────────────
  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setPublishing(true);

    try {
      const res = await csrfFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          description: description.trim(),
          asking_price_low: priceLow,
          asking_price_high: priceHigh,
          screenshots,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create listing");
      }

      toast.success("Listing published successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish listing",
      );
    } finally {
      setPublishing(false);
    }
  };

  const progressScore = project?.progress_score ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isRelist ? "Relist on Marketplace" : "Create Marketplace Listing"}
          </DialogTitle>
          <DialogDescription>
            {isRelist
              ? "Your previous listing will be archived. Review the updated listing before publishing."
              : "Review and edit your listing before publishing to the marketplace."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="listing-title">Title</Label>
                <Input
                  id="listing-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="listing-desc">Description</Label>
                <Textarea
                  id="listing-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project…"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated description. Feel free to edit.
                </p>
              </div>

              {/* Asking Price Range */}
              <div className="space-y-2">
                <Label>Asking Price Range</Label>
                <p className="text-xs text-muted-foreground">
                  Pre-filled from your project valuation. Editing will update your project&apos;s valuation too.
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={priceLow}
                      onChange={(e) => setPriceLow(Number(e.target.value))}
                      className="pl-7"
                      placeholder="Low"
                      min={0}
                    />
                  </div>
                  <span className="text-muted-foreground">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={priceHigh}
                      onChange={(e) => setPriceHigh(Number(e.target.value))}
                      className="pl-7"
                      placeholder="High"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metrics */}
              <div className="space-y-2">
                <Label>Metrics</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <TrendingUp className="size-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{progressScore}%</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <MessageSquare className="size-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{promptCount}</p>
                    <p className="text-xs text-muted-foreground">Prompts</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <Zap className="size-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{tractionSignals}</p>
                    <p className="text-xs text-muted-foreground">Traction</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timeline Snapshot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Timeline Snapshot</Label>
                  <Badge variant="secondary" className="text-xs">
                    {timeline.length} events
                  </Badge>
                </div>
                {timeline.length > 0 ? (
                  <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                    {timeline.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="px-3 py-2 flex items-center justify-between text-sm"
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activity events yet.
                  </p>
                )}
              </div>

              <Separator />

              {/* Screenshots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Screenshots ({screenshots.length}/5)</Label>
                  {screenshots.length === 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertCircle className="size-3.5" />
                      <span className="text-xs">
                        Add at least one screenshot
                      </span>
                    </div>
                  )}
                </div>

                {/* Horizontal scrollable gallery */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {/* Add button */}
                  {screenshots.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="shrink-0 size-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="size-5 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {uploading ? "Uploading…" : "Add"}
                      </span>
                    </button>
                  )}

                  {/* Screenshot thumbnails */}
                  {screenshots.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group shrink-0 size-24 rounded-lg overflow-hidden bg-muted border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Screenshot ${idx + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || loading || !title.trim()}
          >
            {publishing && <Loader2 className="size-4 animate-spin mr-2" />}
            {isRelist ? "Relist" : "Publish Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

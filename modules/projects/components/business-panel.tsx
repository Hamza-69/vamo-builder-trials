"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Link2,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare,
  Award,
  ShoppingCart,
  Gift,
  Ticket,
  Star,
  Zap,
  CheckCircle2,
  Share2,
  PencilIcon,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBusinessPanel, type TimelineEvent, type TractionSignal } from "../hooks/use-business-panel";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────

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

function getProgressBg(score: number): string {
  if (score <= 25) return "bg-red-500";
  if (score <= 50) return "bg-yellow-500";
  if (score <= 75) return "bg-green-500";
  return "bg-blue-500";
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "feature_shipped":
      return <Rocket className="size-4 text-green-500" />;
    case "customer_added":
      return <Users className="size-4 text-blue-500" />;
    case "revenue_logged":
      return <BadgeDollarSign className="size-4 text-emerald-500" />;
    case "prompt":
      return <MessageSquare className="size-4 text-muted-foreground" />;
    case "update":
      return <Zap className="size-4 text-yellow-500" />;
    case "link_linkedin":
      return <Linkedin className="size-4 text-blue-600" />;
    case "link_github":
      return <Github className="size-4 text-foreground" />;
    case "link_website":
      return <Globe className="size-4 text-purple-500" />;
    case "listing_created":
      return <ShoppingCart className="size-4 text-indigo-500" />;
    case "offer_received":
      return <Star className="size-4 text-amber-500" />;
    case "reward_earned":
      return <Gift className="size-4 text-pink-500" />;
    case "reward_redeemed":
      return <Ticket className="size-4 text-orange-500" />;
    case "project_created":
      return <CheckCircle2 className="size-4 text-green-600" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Section Visibility Toggle ────────────────────────────────

interface SectionWrapperProps {
  title: string;
  field: string;
  isVisible: boolean;
  isOwner: boolean;
  onToggle: (field: string, value: boolean) => void;
  children: React.ReactNode;
}

function SectionWrapper({
  title,
  field,
  isVisible,
  isOwner,
  onToggle,
  children,
}: SectionWrapperProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {isOwner && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {isVisible ? (
                    <Eye className="size-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="size-3 text-muted-foreground" />
                  )}
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(checked) => onToggle(field, checked)}
                    className="scale-75 origin-right"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isVisible ? "Visible on public page" : "Hidden on public page"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────

function ValuationSection({
  low,
  high,
  isOwner,
  onSave,
}: {
  low: number | null;
  high: number | null;
  isOwner: boolean;
  onSave: (low: number, high: number) => Promise<void>;
}) {
  const valueLow = low ?? 0;
  const valueHigh = high ?? 0;
  const hasValuation = valueLow > 0 || valueHigh > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [editLow, setEditLow] = useState(String(valueLow));
  const [editHigh, setEditHigh] = useState(String(valueHigh));
  const [isSaving, setIsSaving] = useState(false);
  const lowRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditLow(String(low ?? 0));
    setEditHigh(String(high ?? 0));
  }, [low, high]);

  useEffect(() => {
    if (isEditing) lowRef.current?.focus();
  }, [isEditing]);

  const handleSave = async () => {
    const newLow = Math.max(0, Math.round(Number(editLow) || 0));
    const newHigh = Math.max(0, Math.round(Number(editHigh) || 0));
    if (newLow === valueLow && newHigh === valueHigh) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(newLow, newHigh);
      setIsEditing(false);
      toast.success("Valuation updated");
    } catch {
      toast.error("Failed to save valuation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditLow(String(valueLow));
      setEditHigh(String(valueHigh));
      setIsEditing(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="size-4 text-green-500" />
        <span className="text-xs text-muted-foreground font-medium">
          Estimated Valuation Range
        </span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Low ($)</Label>
              <Input
                ref={lowRef}
                type="number"
                min={0}
                value={editLow}
                onChange={(e) => setEditLow(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                disabled={isSaving}
              />
            </div>
            <span className="mt-5 text-muted-foreground">–</span>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">High ($)</Label>
              <Input
                type="number"
                min={0}
                value={editHigh}
                onChange={(e) => setEditHigh(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditLow(String(valueLow));
                setEditHigh(String(valueHigh));
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => isOwner && setIsEditing(true)}
          className={cn(
            isOwner && "cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors",
          )}
        >
          {hasValuation ? (
            <p className="text-lg font-bold tracking-tight">
              {formatCurrency(valueLow)} – {formatCurrency(valueHigh)}
            </p>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {isOwner ? "Click to set valuation" : "Not yet estimated"}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function WhyBuiltSection({
  whyBuilt,
  isOwner,
  onSave,
}: {
  whyBuilt: string | null;
  isOwner: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(whyBuilt ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(whyBuilt ?? "");
  }, [whyBuilt]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value === (whyBuilt ?? "")) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(value);
      setIsEditing(false);
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setValue(whyBuilt ?? "");
      setIsEditing(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="size-4 text-yellow-500" />
        <span className="text-xs text-muted-foreground font-medium">
          Why I Built This
        </span>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 1000))}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Share your motivation..."
            className="min-h-[80px] text-sm resize-none"
            disabled={isSaving}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {value.length}/1000
            </span>
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => isOwner && setIsEditing(true)}
          className={cn(
            "text-sm",
            isOwner && "cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors",
          )}
        >
          {whyBuilt ? (
            <p className="whitespace-pre-wrap">{whyBuilt}</p>
          ) : (
            <p className="text-muted-foreground italic">
              {isOwner ? "Click to add your motivation…" : "No description yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressSection({ score }: { score: number | null }) {
  const progressScore = score ?? 0;
  const label = getProgressLabel(progressScore);
  const colorClass = getProgressColor(progressScore);
  const bgClass = getProgressBg(progressScore);

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="size-4 text-blue-500" />
        <span className="text-xs text-muted-foreground font-medium">
          Progress Score
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", bgClass)}
              style={{ width: `${progressScore}%` }}
            />
          </div>
        </div>
        <span className={cn("text-lg font-bold tabular-nums", colorClass)}>
          {progressScore}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            colorClass,
          )}
        >
          {label}
        </Badge>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function TractionSignalsSection({
  signals,
}: {
  signals: TractionSignal[];
}) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center">
        <Award className="size-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          Start logging progress in the chat to see traction signals here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5"
        >
          <div className="mt-0.5">{getEventIcon(signal.signal_type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              {signal.description || signal.signal_type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {relativeTime(signal.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkedAssetsSection({
  linkedinUrl,
  githubUrl,
  websiteUrl,
  isOwner,
  onLink,
}: {
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  isOwner: boolean;
  onLink: (type: "linkedin" | "github" | "website", url: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"linkedin" | "github" | "website">("linkedin");
  const [dialogUrl, setDialogUrl] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const assets = [
    {
      type: "linkedin" as const,
      label: "LinkedIn",
      icon: <Linkedin className="size-4" />,
      url: linkedinUrl,
      color: "text-blue-600",
    },
    {
      type: "github" as const,
      label: "GitHub",
      icon: <Github className="size-4" />,
      url: githubUrl,
      color: "text-foreground",
    },
    {
      type: "website" as const,
      label: "Website",
      icon: <Globe className="size-4" />,
      url: websiteUrl,
      color: "text-purple-500",
    },
  ];

  const openDialog = (type: "linkedin" | "github" | "website") => {
    setDialogType(type);
    const existing = assets.find((a) => a.type === type)?.url;
    setDialogUrl(existing ?? "");
    setDialogOpen(true);
  };

  const handleLink = async () => {
    if (!dialogUrl.trim()) return;
    setIsLinking(true);
    try {
      await onLink(dialogType, dialogUrl.trim());
      setDialogOpen(false);
      toast.success(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} linked! +5 🍍`);
    } catch {
      toast.error("Failed to link asset");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {assets.map((asset) => (
          <div
            key={asset.type}
            className={cn(
              "flex-1 rounded-lg border bg-card p-2.5 flex flex-col items-center gap-1.5",
              asset.url && "border-primary/30",
            )}
          >
            <div className={cn("p-1.5 rounded-md bg-muted", asset.color)}>
              {asset.icon}
            </div>
            <span className="text-xs font-medium">{asset.label}</span>
            {asset.url ? (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Linked
                </Badge>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="size-3" />
                </a>
              </div>
            ) : isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => openDialog(asset.type)}
              >
                <Link2 className="size-3 mr-1" />
                Link
              </Button>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Not linked
              </Badge>
            )}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Link {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Paste your {dialogType} URL below. You&apos;ll earn 5 🍍 for linking!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder={`https://${dialogType === "linkedin" ? "linkedin.com/in/..." : dialogType === "github" ? "github.com/..." : "example.com"}`}
              value={dialogUrl}
              onChange={(e) => setDialogUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLinking}
            >
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={isLinking || !dialogUrl.trim()}>
              {isLinking ? "Linking…" : "Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MiniTimelineSection({
  events,
  projectId,
}: {
  events: TimelineEvent[];
  projectId: string;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center">
        <Clock className="size-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          No activity yet. Start building!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-2.5 relative">
          {/* Timeline line */}
          {i < events.length - 1 && (
            <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
          )}
          {/* Icon */}
          <div className="relative z-10 mt-1 shrink-0 flex items-center justify-center size-6 rounded-full bg-muted">
            {getEventIcon(event.event_type)}
          </div>
          {/* Content */}
          <div className="flex-1 pb-3 min-w-0">
            <p className="text-sm leading-snug truncate">
              {event.description || event.event_type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {relativeTime(event.created_at)}
            </p>
          </div>
        </div>
      ))}

      <div className="pt-1">
        <Link
          href={`/panel/public/${projectId}/timeline`}
          target="_blank"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View full timeline
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Editable Header ─────────────────────────────────────────

function EditableHeader({
  name,
  description,
  isOwner,
  projectId,
  onSave,
}: {
  name: string;
  description: string | null;
  isOwner: boolean;
  projectId: string;
  onSave: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDesc, setEditDesc] = useState(description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setEditName(name); }, [name]);
  useEffect(() => { setEditDesc(description ?? ""); }, [description]);
  useEffect(() => { if (isEditingName) nameRef.current?.focus(); }, [isEditingName]);
  useEffect(() => {
    if (isEditingDesc && descRef.current) {
      descRef.current.focus();
      descRef.current.selectionStart = descRef.current.value.length;
    }
  }, [isEditingDesc]);

  const saveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === name) {
      setIsEditingName(false);
      setEditName(name);
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ name: trimmed });
      setIsEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
      setEditName(name);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDesc = async () => {
    const trimmed = editDesc.trim();
    if (trimmed === (description ?? "")) {
      setIsEditingDesc(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ description: trimmed });
      setIsEditingDesc(false);
      toast.success("Description updated");
    } catch {
      toast.error("Failed to update description");
      setEditDesc(description ?? "");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0 space-y-1">
        {/* Name */}
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <Input
              ref={nameRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, 100))}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") { setEditName(name); setIsEditingName(false); }
              }}
              className="h-8 text-lg font-bold"
              disabled={isSaving}
            />
            <span className="text-[10px] text-muted-foreground shrink-0">
              {editName.length}/100
            </span>
          </div>
        ) : (
          <h2
            onClick={() => isOwner && setIsEditingName(true)}
            className={cn(
              "text-lg font-bold tracking-tight flex items-center gap-1.5",
              isOwner && "cursor-pointer hover:opacity-75 transition-opacity",
            )}
          >
            {name}
            {isOwner && <PencilIcon className="size-3 text-muted-foreground shrink-0" />}
          </h2>
        )}

        {/* Description */}
        {isEditingDesc ? (
          <div className="space-y-1">
            <Textarea
              ref={descRef}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value.slice(0, 500))}
              onBlur={saveDesc}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveDesc(); }
                if (e.key === "Escape") { setEditDesc(description ?? ""); setIsEditingDesc(false); }
              }}
              placeholder="Describe your project..."
              className="min-h-[48px] text-xs resize-none"
              disabled={isSaving}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{editDesc.length}/500</span>
              <Button size="sm" variant="ghost" onClick={saveDesc} disabled={isSaving} className="h-6 text-xs">
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => isOwner && setIsEditingDesc(true)}
            className={cn(
              "text-xs text-muted-foreground",
              isOwner && "cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors",
            )}
          >
            {description ? (
              <p className="line-clamp-2 flex items-center gap-1">
                <FileText className="size-3 shrink-0" />
                {description}
              </p>
            ) : (
              <p className="italic flex items-center gap-1">
                {isOwner ? (
                  <>
                    <PencilIcon className="size-3 shrink-0" />
                    Click to add a description…
                  </>
                ) : (
                  "No description yet."
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/panel/public/${projectId}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Share2 className="size-3.5" />
                  <span className="hidden sm:inline">Public Page</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View public business page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

interface BusinessPanelProps {
  projectId: string;
}

export default function BusinessPanel({ projectId }: BusinessPanelProps) {
  const {
    data,
    isLoading,
    error,
    updateWhyBuilt,
    updateProject,
    toggleVisibility,
    linkAsset,
  } = useBusinessPanel(projectId);

  if (isLoading) {
    return <BusinessPanelSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full w-full p-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error || "Failed to load"}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { project, tractionSignals, activityTimeline, isOwner } = data;

  const handleToggle = async (field: string, value: boolean) => {
    try {
      await toggleVisibility(field, value);
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <EditableHeader
          name={project.name}
          description={project.description}
          isOwner={isOwner}
          projectId={projectId}
          onSave={updateProject}
        />

        <Separator />

        {/* 10.1 Valuation Range */}
        <SectionWrapper
          title="Valuation Range"
          field="is_valuation_shown"
          isVisible={project.is_valuation_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <ValuationSection
            low={project.valuation_low}
            high={project.valuation_high}
            isOwner={isOwner}
            onSave={async (low, high) => {
              await updateProject({ valuation_low: low, valuation_high: high });
            }}
          />
        </SectionWrapper>

        {/* 10.2 Why I Built This */}
        <SectionWrapper
          title="Why I Built This"
          field="is_why_shown"
          isVisible={project.is_why_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <WhyBuiltSection
            whyBuilt={project.why_built}
            isOwner={isOwner}
            onSave={async (value) => {
              await updateProject({ why_built: value });
            }}
          />
        </SectionWrapper>

        {/* 10.3 Progress Score */}
        <SectionWrapper
          title="Progress"
          field="is_progress_shown"
          isVisible={project.is_progress_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <ProgressSection score={project.progress_score} />
        </SectionWrapper>

        {/* 10.4 Traction Signals */}
        <SectionWrapper
          title="Traction Signals"
          field="is_traction_shown"
          isVisible={project.is_traction_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <TractionSignalsSection signals={tractionSignals} />
        </SectionWrapper>

        {/* 10.5 Linked Assets */}
        <SectionWrapper
          title="Linked Assets"
          field="is_links_shown"
          isVisible={project.is_links_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <LinkedAssetsSection
            linkedinUrl={project.linkedin_url}
            githubUrl={project.github_url}
            websiteUrl={project.url}
            isOwner={isOwner}
            onLink={linkAsset}
          />
        </SectionWrapper>

        {/* 10.6 Mini Activity Timeline */}
        <SectionWrapper
          title="Activity Timeline"
          field="is_activity_timeline_shown"
          isVisible={project.is_activity_timeline_shown}
          isOwner={isOwner}
          onToggle={handleToggle}
        >
          <MiniTimelineSection events={activityTimeline} projectId={projectId} />
        </SectionWrapper>
      </div>
    </ScrollArea>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────

function BusinessPanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <Separator />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

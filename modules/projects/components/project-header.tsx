"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MoreVerticalIcon,
  PencilIcon,
  StoreIcon,
  SparklesIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeSubmenu } from "@/components/theme-submenu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MessageSquare } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { CreateListingDialog } from "@/modules/marketplace/components/create-listing-dialog"

interface ProjectData {
  id: string
  name: string
  progress_score: number | null
  status: string | null
}

interface ProfileData {
  pineapple_balance: number | null
}

interface ProjectHeaderProps {
  projectId: string
  /** Panel toggle state – used on tablet/desktop */
  activePanels: string[]
  onPanelChange: (panels: string[]) => void
  /** Device flags */
  isDesktop: boolean
  isTablet: boolean
  isMobile: boolean
  /** Content rendered inside the tablet chat sheet */
  chatSheetContent?: React.ReactNode
}

export const ProjectHeader = ({
  projectId,
  activePanels,
  onPanelChange,
  isTablet,
  isMobile,
  chatSheetContent,
}: ProjectHeaderProps) => {
  const supabase = createClient()

  // ── data state ──────────────────────────────────────────────
  const [project, setProject] = useState<ProjectData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  // ── inline‑edit state ───────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [isOutdated, setIsOutdated] = useState(false)
  const [oldScreenshots, setOldScreenshots] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // ── fetch project + profile ─────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const [projectRes, profileRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, progress_score, status")
          .eq("id", projectId)
          .single(),
        supabase
          .from("profiles")
          .select("pineapple_balance")
          .eq("id", user.id)
          .single(),
      ])

      if (projectRes.data) {
        setProject(projectRes.data)
        setEditName(projectRes.data.name)

        // Check if project is listed but has new activity (outdated)
        if (projectRes.data.status === "listed") {
          const { data: activeListing } = await supabase
            .from("listings")
            .select("id, last_timeline_item_id, screenshots")
            .eq("project_id", projectId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (activeListing?.last_timeline_item_id) {
            const { count } = await supabase
              .from("activity_events")
              .select("id", { count: "exact", head: true })
              .eq("project_id", projectId)
              .not("event_type", "in", "(listing_created,listing_relisted,reward_earned,reward_redeemed)")
              .gt("created_at", 
                // Get the created_at of the last timeline item
                (await supabase
                  .from("activity_events")
                  .select("created_at")
                  .eq("id", activeListing.last_timeline_item_id)
                  .single()
                ).data?.created_at ?? ""
              )

            setIsOutdated((count ?? 0) > 0)
            setOldScreenshots(
              (activeListing.screenshots as string[] | null) ?? []
            )
          }
        }
      }
      if (profileRes.data) setProfile(profileRes.data)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // ── focus input when editing starts ─────────────────────────
  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  // ── save name ───────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === project?.name) {
      setIsEditing(false)
      setEditName(project?.name ?? "")
      return
    }

    await supabase
      .from("projects")
      .update({ name: trimmed })
      .eq("id", projectId)

    setProject((prev) => (prev ? { ...prev, name: trimmed } : prev))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveName()
    if (e.key === "Escape") {
      setIsEditing(false)
      setEditName(project?.name ?? "")
    }
  }

  const progressScore = project?.progress_score ?? 0
  const pineappleBalance = profile?.pineapple_balance ?? 0
  const isAlreadyListed = project?.status === 'listed'
  const canRelist = isAlreadyListed && isOutdated

  // ── render ──────────────────────────────────────────────────
  return (
    <header className="px-3 py-2 grid grid-cols-[1fr_auto_1fr] items-center border-b gap-x-2">
      {/* ── Left: back + name + pineapple ── */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Project dropdown (Go to Dashboard + Appearance) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image src="/icon.svg" alt="Vamo" height={18} width={18} />
              <span className="truncate max-w-36">{project?.name ?? "Loading…"}</span>
              <ChevronDownIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" style={{ zIndex: 100 }}>
            <DropdownMenuItem asChild>
              <Link href="/projects">
                <ChevronLeftIcon className="size-4" />
                <span>Go to Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeSubmenu />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Project name (inline‑editable) */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveName}
            onKeyDown={handleKeyDown}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-48"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-sm font-medium hover:opacity-75 transition-opacity"
          >
            <PencilIcon className="size-3 text-muted-foreground shrink-0" />
          </button>
        )}

        {/* Pineapple balance badge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 shrink-0 cursor-default">
                <span className="text-base leading-none">🍍</span>
                <span>{pineappleBalance}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">Pineapple balance</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Center: panel toggles ── */}
      {!isMobile ? (
        <div className="flex items-center justify-center gap-x-2">
          {/* Tablet: Chat sheet trigger */}
          {isTablet && chatSheetContent && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px] sm:w-[400px] p-0 gap-0">
                <div className="h-full flex flex-col pt-6">
                  {chatSheetContent}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <ToggleGroup
            type="multiple"
            value={activePanels}
            onValueChange={(v) => v.length > 0 && onPanelChange(v)}
            variant="outline"
          >
            {["chat", "preview", "business"].map((value) => {
              if (isTablet && value === "chat") return null
              return (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="hover:bg-secondary hover:text-primary"
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      ) : (
        <div />
      )}

      {/* ── Right: action buttons ── */}
      <div className="flex items-center gap-1.5 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={progressScore < 10 || (isAlreadyListed && !canRelist) ? 0 : undefined}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={progressScore < 10 || (isAlreadyListed && !canRelist)}
                >
                  <SparklesIcon className="size-3.5" />
                  <span className="hidden sm:inline">Get Vamo Offer</span>
                </Button>
              </span>
            </TooltipTrigger>
            {progressScore < 10 && (
              <TooltipContent side="bottom">
                Reach a progress score of 10 to unlock
              </TooltipContent>
            )}
            {isAlreadyListed && !canRelist && progressScore >= 10 && (
              <TooltipContent side="bottom">
                Project is already listed with no new activity
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={progressScore < 20 || (isAlreadyListed && !canRelist) ? 0 : undefined}>
                <Button
                  variant={canRelist ? "outline" : "default"}
                  size="sm"
                  className="gap-1.5"
                  disabled={progressScore < 20 || (isAlreadyListed && !canRelist)}
                  onClick={() => setListDialogOpen(true)}
                >
                  {canRelist ? (
                    <RefreshCwIcon className="size-3.5" />
                  ) : (
                    <StoreIcon className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {canRelist
                      ? "Relist"
                      : isAlreadyListed
                        ? "Listed"
                        : "List for Sale"}
                  </span>
                </Button>
              </span>
            </TooltipTrigger>
            {progressScore < 20 && (
              <TooltipContent side="bottom">
                Reach a progress score of 20 to unlock
              </TooltipContent>
            )}
            {isAlreadyListed && !canRelist && (
              <TooltipContent side="bottom">
                This project is already listed on the marketplace
              </TooltipContent>
            )}
            {canRelist && (
              <TooltipContent side="bottom">
                New activity detected — relist with updated data
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Listing creation dialog */}
      <CreateListingDialog
        projectId={projectId}
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        isRelist={canRelist}
        existingScreenshots={canRelist ? oldScreenshots : undefined}
        onSuccess={() => {
          setProject((prev) => prev ? { ...prev, status: 'listed' } : prev)
          setIsOutdated(false)
        }}
      />
    </header>
  )
}

export const ProjectHeaderSkeleton = () => (
  <header className="px-3 py-2 flex items-center border-b gap-x-2">
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
    <div className="flex-1 flex justify-center">
      <Skeleton className="h-8 w-48" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-8 w-24" />
    </div>
  </header>
)
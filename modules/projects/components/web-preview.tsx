"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ExternalLinkIcon, RefreshCcwIcon, MonitorIcon, TabletIcon, SmartphoneIcon, LinkIcon, ImageIcon, Settings2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  url?: string | null
  screenshotUrl?: string | null
  onOpenSettings?: () => void
}

type DeviceSate = "desktop" | "tablet" | "mobile"

const LOAD_TIMEOUT = 5000

export function WebPreview({ url, screenshotUrl, onOpenSettings }: Props) {
  const [fragmentKey, setFragmentKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDesktop = useMediaQuery("(min-width: 1280px)")
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)")
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [device, setDevice] = useState<DeviceSate>("desktop")

  // Sync device state when media query values resolve after hydration
  useEffect(() => {
    if (isTablet) setDevice("tablet")
    else if (isMobile) setDevice("mobile")
    else setDevice("desktop")
  }, [isDesktop, isTablet, isMobile])

  // Start load timeout whenever the iframe key or url changes
  useEffect(() => {
    if (!url) return

    setLoading(true)
    setFailed(false)

    timeoutRef.current = setTimeout(() => {
      setLoading(false)
      setFailed(true)
    }, LOAD_TIMEOUT)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [url, fragmentKey])

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setLoading(false)
    setFailed(false)
  }

  const handleIframeError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setLoading(false)
    setFailed(true)
  }

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1)
  }

  const handleCopy = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 5000)
  }

  // ── No URL: empty state ──────────────────────────────────────────────
  if (!url) {
    return (
      <div className="flex flex-col w-full flex-1 min-h-0 items-center justify-center gap-4 p-8 text-center">
        {screenshotUrl ? (
          <Image
            src={screenshotUrl}
            alt="Project screenshot"
            width={600}
            height={400}
            className="max-w-full max-h-[60%] rounded-md border object-contain shadow-sm"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <LinkIcon className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No project URL linked</p>
          <p className="text-xs text-muted-foreground">
            Link a project URL to see a live preview
          </p>
        </div>
        {onOpenSettings && (
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings2Icon className="size-4 mr-1.5" />
            Project Settings
          </Button>
        )}
      </div>
    )
  }

  // ── Fallback content (iframe failed / X-Frame-Options) ───────────────
  const renderFallback = () => {
    if (screenshotUrl) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-4">
          <Image
            src={screenshotUrl}
            alt="Project screenshot"
            width={800}
            height={600}
            className="max-w-full max-h-[80%] rounded-md border object-contain shadow-sm"
          />
          <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
            <ExternalLinkIcon className="size-4 mr-1.5" />
            Open in new tab
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Preview unavailable</p>
          <p className="text-xs text-muted-foreground">
            This site cannot be embedded in an iframe.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
          Open in new tab
          <ExternalLinkIcon className="size-4 ml-1.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full flex-1 min-h-0">
      {/* Toolbar */}
      <div className="p-2 border-b flex bg-sidebar items-center gap-x-4 shrink-0">
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCcwIcon  className="text-foreground" />
        </Button>

        {(isTablet || isDesktop) && (
          <div className="flex items-center mx-4">
            <ToggleGroup type="single" value={device} onValueChange={(v: DeviceSate) => v && setDevice(v)}>
              {isDesktop && (
                <ToggleGroupItem value="desktop" size="sm">
                  <MonitorIcon className="h-4 w-4" />
                </ToggleGroupItem>
              )}
              {(isTablet || isDesktop) && (
                <ToggleGroupItem value="tablet" size="sm">
                  <TabletIcon className="h-4 w-4" />
                </ToggleGroupItem>
              )}
              <ToggleGroupItem value="mobile" size="sm">
                <SmartphoneIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="flex flex-1 justify-start text-start font-normal"
          disabled={copied}
        >
          <span className="truncate text-foreground">{url}</span>
        </Button>

        <Button size="sm" variant="outline" onClick={() => window.open(url, "_blank")}>
          <ExternalLinkIcon className="text-foreground"/>
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center relative">
        {/* Loading skeleton */}
        {loading && !failed && (
          <div className="absolute inset-0 z-10 flex flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="flex-1 w-full rounded-md" />
          </div>
        )}

        {/* Fallback */}
        {failed && renderFallback()}

        {/* Iframe — always mounted so onLoad/onError can fire */}
        <iframe
          key={fragmentKey}
          className={cn(
            "border bg-background transition-all duration-300 shadow-sm",
            device === "desktop" && "w-full h-full border-none",
            device === "tablet" && cn("w-[768px] h-[calc(100%-2rem)] rounded-md", isTablet && "w-full h-full"),
            device === "mobile" && "w-[375px] h-[calc(100%-2rem)] rounded-md",
            failed && "hidden",
            loading && "opacity-0"
          )}
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="lazy"
          src={url}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  )
}
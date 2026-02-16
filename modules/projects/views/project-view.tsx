"use client"

import { cn } from "@/lib/utils"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { MessagesSkeleton } from "../components/message-loading"
import BusinessPanel from "../components/business-panel"
import { WebPreview } from "../components/web-preview"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectHeader } from "../components/project-header"
import type { ChatResponse } from "../hooks/use-chat"
import type { Project } from "../types"

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const [activePanels, setActivePanels] = useState<string[]>(["chat", "preview", "business"])
  const [isMounted, setIsMounted] = useState(false)
  const [businessPanelKey, setBusinessPanelKey] = useState(0)
  const refetchBalanceRef = useRef<(() => void) | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const isDesktop = useMediaQuery("(min-width: 1280px)")
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)")
  const isMobile = useMediaQuery("(max-width: 767px)")

  const handleBusinessUpdate = useCallback(
    (_update: ChatResponse["business_update"]) => {
      // Trigger a re-render of the business panel
      setBusinessPanelKey((k) => k + 1)
    },
    [],
  )

  const handlePineappleEarned = useCallback(() => {
    refetchBalanceRef.current?.()
  }, [])

  const handleRefetchBalance = useCallback((refetch: () => void) => {
    refetchBalanceRef.current = refetch
  }, [])

  // Fetch project data for url and screenshot_url
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}/business`)
        if (res.ok) {
          const data = await res.json()
          setProject(data.project)
        }
      } catch {
        // Silently fail — the WebPreview will show its empty state
      }
    }
    fetchProject()
  }, [projectId, businessPanelKey])

  const url = project?.url ?? null
  const screenshotUrl = project?.screenshot_url ?? null

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden">
        <ProjectHeader
          projectId={projectId}
          activePanels={activePanels}
          onPanelChange={setActivePanels}
          isDesktop={false}
          isTablet={false}
          isMobile={true}
          onRefetchBalance={handleRefetchBalance}
        />

        <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0 w-full">
          <div className="border-b px-4 py-2 shrink-0 bg-background">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 relative w-full">
            <TabsContent value="chat" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col">
              <ErrorBoundary fallback={<p className="p-4">Error loading messages.</p>}>
                <Suspense fallback={<MessagesSkeleton />}>
                  <MessagesContainer projectId={projectId} onBusinessUpdate={handleBusinessUpdate} onPineappleEarned={handlePineappleEarned} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="preview" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col">
              <WebPreview url={url} screenshotUrl={screenshotUrl} />
            </TabsContent>
            <TabsContent value="business" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col overflow-hidden">
              <BusinessPanel
                key={businessPanelKey}
                projectId={projectId}
                onPineappleEarned={handlePineappleEarned}
                onProjectUpdate={() => handleBusinessUpdate({} as any)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    )
  }

  // Tablet & Desktop Shared State Logic
  const showMessages = isDesktop ? activePanels.includes("chat") : false
  const showPreview = activePanels.includes("preview")
  const showBusiness = activePanels.includes("business")

  const handlePanelChange = (value: string[]) => {
    if (value.length > 0) {
      setActivePanels(value)
    }
  }

  const getFlexValues = () => {
    if (showMessages && showPreview && showBusiness) {
      return { messages: 1, preview: 2, business: 1 }
    }

    if (showMessages && (showPreview || showBusiness)) {
      return {
        messages: 1,
        preview: showPreview ? 3 : 0,
        business: showBusiness ? 3 : 0,
      }
    }

    if (showPreview && showBusiness) {
      return { messages: 0, preview: 2, business: isTablet ? 1 : 2 }
    }

    if (showMessages) return { messages: 1 }
    if (showPreview) return { preview: 1 }
    if (showBusiness) return { business: 1 }

    return {}
  }

  const flexValues = getFlexValues()

  // Chat sheet content for tablet mode
  const chatSheetContent = (
    <ErrorBoundary fallback={<p className="p-4">Error loading messages.</p>}>
      <Suspense fallback={<MessagesSkeleton />}>
        <MessagesContainer projectId={projectId} onBusinessUpdate={handleBusinessUpdate} onPineappleEarned={handlePineappleEarned} />
      </Suspense>
    </ErrorBoundary>
  )

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <ProjectHeader
        projectId={projectId}
        activePanels={activePanels}
        onPanelChange={handlePanelChange}
        isDesktop={isDesktop}
        isTablet={isTablet}
        isMobile={false}
        chatSheetContent={isTablet ? chatSheetContent : undefined}
        onRefetchBalance={handleRefetchBalance}
      />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {showMessages && (
          <div style={{ flex: flexValues.messages }} className="flex flex-col min-h-0 min-w-0 overflow-hidden">
            <ErrorBoundary fallback={<p>Error loading messages.</p>}>
              <Suspense fallback={<MessagesSkeleton />}>
                <MessagesContainer projectId={projectId} onBusinessUpdate={handleBusinessUpdate} onPineappleEarned={handlePineappleEarned} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {showPreview && (
          <div
            style={{ flex: flexValues.preview }}
            className={cn("flex flex-col min-h-0 min-w-0 overflow-hidden", showMessages && "border-l")}
          >
            <WebPreview url={url} screenshotUrl={screenshotUrl} />
          </div>
        )}

        {showBusiness && (
          <div
            style={{ flex: flexValues.business }}
            className={cn("flex flex-col min-h-0 min-w-0 overflow-hidden", (showMessages || showPreview) && "border-l")}
          >
            <BusinessPanel
              key={businessPanelKey}
              projectId={projectId}
              onPineappleEarned={handlePineappleEarned}
              onProjectUpdate={() => handleBusinessUpdate({} as any)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
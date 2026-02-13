"use client"

import { cn } from "@/lib/utils"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useEffect, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ErrorBoundary } from "react-error-boundary"
import { MessagesSkeleton } from "../components/message-loading"
import BussinessPage from "../components/bussiness-page"
import { WebPreview } from "../components/web-preview"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const [activePanels, setActivePanels] = useState<string[]>(["chat", "preview", "business"])
  const [isMounted, setIsMounted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 1280px)")
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)")
  const isMobile = useMediaQuery("(max-width: 767px)")

  const url = "https://vibable.xyz" // Replace with actual URL from your data source

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full w-full">
          <div className="border-b px-4 py-2">
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
                  <MessagesContainer projectId={projectId} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="preview" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col">
              <WebPreview url={url} />
            </TabsContent>
            <TabsContent value="business" className="h-full mt-0 border-0 p-0 data-[state=active]:flex flex-col">
              <BussinessPage />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    )
  }

  // Tablet & Desktop Shared State Logic
  const showMessages = isDesktop ? activePanels.includes("chat") : false // Always hidden from flex layout on Tablet
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

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full flex items-center p-2 border-b gap-x-2">
        {/* Tablet: Chat Trigger */}
        {isTablet && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[400px] sm:w-[400px] p-0 gap-0">
              <div className="h-full flex flex-col pt-6">
                <ErrorBoundary fallback={<p className="p-4">Error loading messages.</p>}>
                  <Suspense fallback={<MessagesSkeleton />}>
                    <MessagesContainer projectId={projectId} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </SheetContent>
          </Sheet>
        )}

        <ToggleGroup
          type="multiple"
          value={activePanels}
          onValueChange={handlePanelChange}
          variant="outline"
        >
          {["chat", "preview", "business"].map((value) => {
             // Hide Chat option in ToggleGroup on Tablet
             if (isTablet && value === "chat") return null
             
             return (
              <ToggleGroupItem key={value} value={value} className="hover:bg-secondary hover:text-primary">
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>
      <div className="flex flex-1 min-h-0 h-full w-full">
        {showMessages && (
          <div style={{ flex: flexValues.messages }} className="flex flex-col min-h-0">
            <ErrorBoundary fallback={<p>Error loading messages.</p>}>
              <Suspense fallback={<MessagesSkeleton />}>
                <MessagesContainer projectId={projectId} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {showPreview && (
          <div
            style={{ flex: flexValues.preview }}
            className={cn("flex flex-col min-h-0", showMessages && "border-l")}
          >
            <WebPreview url={url} />
          </div>
        )}

        {showBusiness && (
          <div
            style={{ flex: flexValues.business }}
            className={cn("flex flex-col min-h-0", (showMessages || showPreview) && "border-l")}
          >
            <BussinessPage />
          </div>
        )}
      </div>
    </div>
  )
}
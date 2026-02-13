"use client"

import { cn } from "@/lib/utils"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ErrorBoundary } from "react-error-boundary"
import { MessagesSkeleton } from "../components/message-loading"
import BussinessPage from "../components/bussiness-page"
import { WebPreview } from "../components/web-preview"

interface Props {
  projectId: string
}

export const ProjectView = ({projectId}: Props) =>{
  const [activePanels, setActivePanels] = useState<string[]>(["chat", "preview", "business"])
  const url = "https://vibable.xyz" // Replace with actual URL from your data source

  const showMessages = activePanels.includes("chat")
  const showPreview = activePanels.includes("preview")
  const showBusiness = activePanels.includes("business")

  const handlePanelChange = (value: string[]) => {
    if (value.length > 0) {
      setActivePanels(value)
    }
  }

  const getFlexValues = () => {
    if (showMessages && showPreview && showBusiness) {
      return { messages: 1, preview: 2, business: 1 };
    }

    if (showMessages && (showPreview || showBusiness)) {
      return {
        messages: 1,
        preview: showPreview ? 3 : 0,
        business: showBusiness ? 3 : 0,
      };
    }

    if (showPreview && showBusiness) {
      return { messages: 0, preview: 1, business: 1 };
    }

    if (showMessages) return { messages: 1 };
    if (showPreview) return { preview: 1 };
    if (showBusiness) return { business: 1 };

    return {};
  };

  const flexValues = getFlexValues();

  return (
    <div className="h-screen flex flex-col">
        <div className="w-full flex items-center p-2 border-b gap-x-2">
          <ToggleGroup
            type="multiple"
            value={activePanels}
            onValueChange={handlePanelChange}
            variant="outline" // or "default"
          >
            {["chat", "preview", "business"].map((value) => (
              <ToggleGroupItem key={value} value={value} className="hover:bg-secondary hover:text-primary">
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      <div className="flex flex-1 min-h-0 h-full w-full">
        {showMessages && (
          <div
            style={{ flex: flexValues.messages }}
            className="flex flex-col min-h-0"
          >
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
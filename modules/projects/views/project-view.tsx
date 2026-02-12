"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { ProjectHeader } from "../components/project-header"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { CodeIcon, EyeIcon } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"
import { ProjectHeaderSkeleton } from "../components/project-header"
import { MessagesSkeleton } from "../components/message-loading"

interface Props {
  projectId: string
}

export const ProjectView = ({projectId}: Props) =>{
  const [tabState, setTabState] = useState<"preview" | "code">("preview")

  return (
    <div className="h-screen">
      <ResizablePanelGroup>
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0">
          <ErrorBoundary fallback={<p>Error loading project.</p>}>
              <Suspense fallback={<ProjectHeaderSkeleton />}>
                <ProjectHeader projectId={projectId}/>
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary fallback={<p>Error loading messages.</p>}>
              <Suspense fallback={<MessagesSkeleton />}>
                <MessagesContainer 
                  projectId = {projectId}
                />
              </Suspense>
            </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="z-50 hover:bg-primary transition-colors"/>
        <ResizablePanel
          defaultSize={65}
          minSize={50}
          className="flex flex-col min-h-0"
        >
          <Tabs className="h-full gap-y-0" defaultValue="preview" value={tabState} onValueChange={(value) => setTabState(value as "preview" | "code")}>
            <div className="w-full flex items-center  p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md cursor-pointer">
                  <EyeIcon/> <span>Demo</span>
                </TabsTrigger><TabsTrigger value="code" className="rounded-md cursor-pointer">
                  <CodeIcon/> <span>Code</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview">
              hi
            </TabsContent>
            <TabsContent value="code" className="h-full min-h-0 flex flex-col">
              bye
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
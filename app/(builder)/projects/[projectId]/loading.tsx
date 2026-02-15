import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

/* ── Chat panel skeleton (reused) ── */
function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 flex-1 min-h-0">
      {/* Assistant message */}
      <div className="flex flex-col px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <div className="pl-8.5 flex flex-col gap-y-2">
          <Skeleton className="h-4 w-[75%]" />
          <Skeleton className="h-4 w-[55%]" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      {/* User message */}
      <div className="flex flex-col items-end pr-2 pl-10 pb-4">
        <Skeleton className="h-16 w-[65%] rounded-lg" />
        <Skeleton className="h-3 w-12 mt-1 mr-1" />
      </div>
      {/* Assistant message */}
      <div className="flex flex-col px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <div className="pl-8.5 flex flex-col gap-y-2">
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[40%]" />
        </div>
      </div>
      {/* User message */}
      <div className="flex flex-col items-end pr-2 pl-10 pb-4">
        <Skeleton className="h-10 w-[50%] rounded-lg" />
        <Skeleton className="h-3 w-12 mt-1 mr-1" />
      </div>
    </div>
  )
}

/* ── Preview panel skeleton ── */
function PreviewSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-2">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 py-2 border rounded-t-lg">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-5 flex-1 rounded" />
        <Skeleton className="h-4 w-4" />
      </div>
      {/* Page content */}
      <Skeleton className="flex-1 w-full rounded-b-lg" />
    </div>
  )
}

/* ── Business panel skeleton (matches BusinessPanelSkeleton) ── */
function BusinessSkeleton() {
  return (
    <div className="p-4 space-y-4 flex-1 min-h-0 overflow-hidden">
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
  )
}

/* ── Header skeleton (matches ProjectHeader) ── */
function HeaderSkeleton({ showToggle }: { showToggle: boolean }) {
  return (
    <header className="px-3 py-2 grid grid-cols-[1fr_auto_1fr] items-center border-b gap-x-2">
      {/* Left: back + name + pineapple */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {/* Center: panel toggles */}
      <div className="flex items-center justify-center">
        {showToggle && (
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        )}
      </div>
      {/* Right: actions */}
      <div className="flex items-center justify-end gap-1.5">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </header>
  )
}

export default function ProjectBuilderLoading() {
  return (
    <div className="h-screen w-screen flex flex-col">
      {/* ── Mobile layout (< 768px) ── */}
      <div className="flex flex-col h-full md:hidden">
        <HeaderSkeleton showToggle={false} />
        {/* Mobile tab bar */}
        <div className="border-b px-4 py-2">
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            <Skeleton className="h-7 rounded-md" />
            <Skeleton className="h-7 rounded-md" />
            <Skeleton className="h-7 rounded-md" />
          </div>
        </div>
        {/* Active tab content (chat by default) */}
        <ChatSkeleton />
      </div>

      {/* ── Tablet layout (768px – 1279px) ── */}
      <div className="hidden md:flex xl:hidden flex-col h-full">
        <HeaderSkeleton showToggle={true} />
        <div className="flex flex-1 min-h-0 w-full">
          {/* Preview: flex 2 */}
          <div className="flex flex-col min-h-0" style={{ flex: 2 }}>
            <PreviewSkeleton />
          </div>
          {/* Business: flex 1 */}
          <div className="flex flex-col min-h-0 border-l" style={{ flex: 1 }}>
            <BusinessSkeleton />
          </div>
        </div>
      </div>

      {/* ── Desktop layout (≥ 1280px) ── */}
      <div className="hidden xl:flex flex-col h-full">
        <HeaderSkeleton showToggle={true} />
        <div className="flex flex-1 min-h-0 w-full">
          {/* Chat: flex 1 */}
          <div className="flex flex-col min-h-0" style={{ flex: 1 }}>
            <ChatSkeleton />
          </div>
          {/* Preview: flex 2 */}
          <div className="flex flex-col min-h-0 border-l" style={{ flex: 2 }}>
            <PreviewSkeleton />
          </div>
          {/* Business: flex 1 */}
          <div className="flex flex-col min-h-0 border-l" style={{ flex: 1 }}>
            <BusinessSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

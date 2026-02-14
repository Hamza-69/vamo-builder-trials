import Image from "next/image"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const ShimmerMessages = () => {
  const messages = [
    "Loading...",
    "Analyzing your request...",
    "Thinking...",
    "Generating...",
    "Almost ready..."
  ]

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => ((prev+1) % messages.length))
    }, 2000)

    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  )
}

export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
        src={"/icon.svg"}
        alt="Vamo"
        width={18}
        height={18}
        className="shrink-0"
        />
        <span className="text-sm font-medium">Vamo</span>
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <ShimmerMessages/>
      </div>
    </div>
  )
}

export const MessagesSkeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    {/* Simulated assistant message */}
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

    {/* Simulated user message */}
    <div className="flex flex-col items-end pr-2 pl-10 pb-4">
      <Skeleton className="h-16 w-[65%] rounded-lg" />
      <Skeleton className="h-3 w-12 mt-1 mr-1" />
    </div>

    {/* Simulated assistant message */}
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

    {/* Simulated user message */}
    <div className="flex flex-col items-end pr-2 pl-10 pb-4">
      <Skeleton className="h-10 w-[50%] rounded-lg" />
      <Skeleton className="h-3 w-12 mt-1 mr-1" />
    </div>

    {/* Simulated assistant message */}
    <div className="flex flex-col px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <div className="pl-8.5 flex flex-col gap-y-2">
        <Skeleton className="h-4 w-[60%]" />
        <Skeleton className="h-4 w-[70%]" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
)

export const LoadMoreSkeleton = () => (
  <div className="flex flex-col gap-3 px-2 py-2">
    {/* Two compact skeleton messages at the top */}
    <div className="flex flex-col items-end pr-2 pl-10">
      <Skeleton className="h-10 w-[50%] rounded-lg" />
    </div>
    <div className="flex flex-col px-2">
      <div className="flex items-center gap-2 pl-2 mb-1">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="pl-8.5 flex flex-col gap-y-1.5">
        <Skeleton className="h-3.5 w-[70%]" />
        <Skeleton className="h-3.5 w-[45%]" />
      </div>
    </div>
  </div>
)
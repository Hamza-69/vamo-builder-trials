import { MessageCard } from "./message-card"
import { MessageForm } from "./message-form"
import { useCallback, useEffect, useRef } from "react"
import { MessageLoading, MessagesSkeleton, LoadMoreSkeleton } from "./message-loading"
import { toast } from "sonner"
import { useChat, type ChatResponse } from "../hooks/use-chat"

interface Props {
  projectId: string
  onBusinessUpdate?: (update: ChatResponse["business_update"]) => void
  onPineappleEarned?: () => void
}

export const MessagesContainer = ({ projectId, onBusinessUpdate, onPineappleEarned }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const prevScrollHeightRef = useRef<number>(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isLoadingMoreRef = useRef(false)

  const {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    loadMessages,
    loadMore,
    sendMessage,
  } = useChat(projectId)

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Scroll to bottom when new messages are appended (optimistic user msg or assistant reply)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isLoadingMoreRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Initial scroll to bottom once first page loads
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading && messages.length === 0])

  // Infinite scroll up — load more when the sentinel enters the viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          isLoadingMoreRef.current = true
          const prevHeight = container.scrollHeight
          loadMore().then(() => {
            // Double rAF to ensure DOM has flushed before restoring scroll
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight - prevHeight
                // Delay clearing the flag so the scroll-to-bottom effect
                // (which fires on messages.length change) doesn't interfere
                setTimeout(() => {
                  isLoadingMoreRef.current = false
                }, 50)
              })
            })
          })
        }
      },
      { root: container, threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, loadMore])

  const handleSend = useCallback(
    async (content: string, tag?: "feature" | "customer" | "revenue" | "ask" | "general") => {
      const result = await sendMessage(content, tag)
      if (result) {
        if (result.pineapples_earned > 0) {
          toast.success(`+${result.pineapples_earned} 🍍 ${result.pineapples_earned === 1 ? "pineapple" : "pineapples"} earned!`)
          onPineappleEarned?.()
        }
        if (onBusinessUpdate && result.business_update) {
          onBusinessUpdate(result.business_update)
        }
      } else if (error) {
        toast.error(error)
      }
      return result
    },
    [sendMessage, error, onBusinessUpdate, onPineappleEarned],
  )

  const isInitialLoad = isLoading && messages.length === 0

  const lastMessage = messages[messages.length - 1]
  const lastMessageIsUser = lastMessage?.role === "user"

  if (isInitialLoad) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessagesSkeleton />
        </div>
        <div className="relative p-3 pt-1">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
          <MessageForm
            projectId={projectId}
            isSending={isSending}
            onSend={handleSend}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {/* Sentinel for infinite scroll up */}
          <div ref={sentinelRef} className="h-1" />
          {isLoading && hasMore && <LoadMoreSkeleton />}

          {messages.map((m) => (
            <MessageCard
              key={m.id}
              content={m.content}
              role={m.role as "user" | "assistant"}
              createdAt={new Date(m.created_at ?? Date.now())}
              type={m.message_type as "success" | "failure"}
              tag={m.tag}
              extractedIntent={m.extracted_intent}
              pineapplesEarned={m.pineapples_earned}
            />
          ))}

          {(isSending || lastMessageIsUser) && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
        <MessageForm
          projectId={projectId}
          isSending={isSending}
          onSend={handleSend}
        />
      </div>
    </div>
  )
}

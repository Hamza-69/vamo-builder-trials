import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNowStrict, differenceInHours } from "date-fns"
import Image from "next/image"

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Tag = "feature" | "customer" | "revenue" | "ask" | "general"

const TAG_STYLES: Record<Tag, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  feature:  { label: "Feature",  variant: "default" },
  customer: { label: "Customer", variant: "secondary" },
  revenue:  { label: "Revenue",  variant: "outline" },
  ask:      { label: "Ask",      variant: "secondary" },
  general:  { label: "General",  variant: "outline" },
}

function formatRelativeTime(date: Date): string {
  const hoursAgo = differenceInHours(new Date(), date)
  if (hoursAgo < 24) {
    return formatDistanceToNowStrict(date, { addSuffix: true })
  }
  return format(date, "MMM dd, yyyy 'at' HH:mm")
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageCardProps {
  content: string
  role: "user" | "assistant"
  createdAt: Date
  type: "success" | "failure"
  tag?: string | null
  extractedIntent?: string | null
  pineapplesEarned?: number | null
}

// ─── User Message ─────────────────────────────────────────────────────────────

interface UserMessageProps {
  content: string
  createdAt: Date
  tag?: string | null
}

const UserMessage = ({ content, createdAt, tag }: UserMessageProps) => {
  const validTag = tag && tag in TAG_STYLES ? (tag as Tag) : null

  return (
    <div className="flex flex-col group items-end gap-1 pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted shadow-none p-3 border-none max-w-[80%] wrap-break-word">
        {content}
      </Card>
      <div className="flex flex-col items-end">
        {validTag && (
          <Badge variant={TAG_STYLES[validTag].variant} className="text-[10px] h-4">
            {TAG_STYLES[validTag].label}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {formatRelativeTime(createdAt)}
        </span>
      </div>
    </div>
  )
}

// ─── Assistant Message ────────────────────────────────────────────────────────

interface AssistantMessageProps {
  content: string
  createdAt: Date
  type: "success" | "failure"
  extractedIntent?: string | null
  pineapplesEarned?: number | null
}

const AssistantMessage = ({
  content,
  createdAt,
  type,
  extractedIntent,
  pineapplesEarned,
}: AssistantMessageProps) => {
  const validIntent = extractedIntent && extractedIntent in TAG_STYLES ? (extractedIntent as Tag) : null

  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "failure" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image src="/icon.svg" alt="Vamo Icon" width={16} height={16} />
        <span className="text-sm font-medium">Vamo</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      <div className="pl-8.5 flex flex-col gap-y-2">
        <span>{content}</span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {validIntent && (
            <Badge variant={TAG_STYLES[validIntent].variant} className="text-[10px] h-4 px-1.5">
              {TAG_STYLES[validIntent].label}
            </Badge>
          )}
          {pineapplesEarned != null && pineapplesEarned > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
              <span>🍍</span>
              <span>+{pineapplesEarned}</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────────

export const MessageCard = ({
  content,
  role,
  createdAt,
  type,
  tag,
  extractedIntent,
  pineapplesEarned,
}: MessageCardProps) => {
  if (role === "assistant") {
    return (
      <AssistantMessage
        content={content}
        createdAt={createdAt}
        type={type}
        extractedIntent={extractedIntent}
        pineapplesEarned={pineapplesEarned}
      />
    )
  }

  return <UserMessage content={content} createdAt={createdAt} tag={tag} />
}
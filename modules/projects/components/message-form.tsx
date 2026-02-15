import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Form, FormField } from "@/components/ui/form"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { ChatTag, ChatResponse } from "../hooks/use-chat"

const TAG_OPTIONS: { value: ChatTag; label: string }[] = [
  { value: "feature", label: "Feature" },
  { value: "customer", label: "Customer" },
  { value: "revenue", label: "Revenue" },
  { value: "ask", label: "Ask" },
]

interface Props {
  projectId: string
  isSending: boolean
  onSend: (content: string, tag?: ChatTag) => Promise<ChatResponse | null>
}

const formSchema = z.object({
  value: z.string().min(1, { message: "Value is required" }).max(10000, { message: "Value is too long" })
})

export const MessageForm = ({ projectId, isSending, onSend }: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    }
  })

  const isDesktop = useMediaQuery("(min-width: 1280px)")

  const [isFocused, setIsFocused] = useState(false)
  const [selectedTag, setSelectedTag] = useState<ChatTag | null>(null)

  const isDisabled = isSending

  const savedContentRef = useRef<{ value: string; tag: ChatTag | null } | null>(null)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const content = values.value.trim()
    if (!content) return

    // Clear immediately for snappy UX, keep a backup to restore on failure
    const currentTag = selectedTag
    savedContentRef.current = { value: content, tag: currentTag }
    form.reset()
    setSelectedTag(null)

    // Blur textarea on mobile to dismiss virtual keyboard,
    // preventing viewport resize jank
    if (window.innerWidth < 768) {
      const active = document.activeElement as HTMLElement | null
      active?.blur()
    }

    const result = await onSend(content, currentTag ?? undefined)

    if (result) {
      savedContentRef.current = null
      trackEvent("prompt_sent", { projectId, messageId: result.userMessage?.id })
    } else {
      // Restore the text so the user can retry
      form.setValue("value", savedContentRef.current?.value ?? content)
      setSelectedTag(savedContentRef.current?.tag ?? null)
      savedContentRef.current = null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs"
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              disabled={isSending}
              {...field}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-hidden bg-transparent"
              placeholder="Share an update on your project…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)(e)
                }
              }}
            />
          )}
        />

        {/* Tag selector + submit */}
        <div className="flex items-end justify-between gap-2 pt-2">
          <div className="flex items-center gap-1 flex-wrap">
            {TAG_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={selectedTag === opt.value ? "default" : "outline"}
                size="xs"
                onClick={() =>
                  setSelectedTag((prev) =>
                    prev === opt.value ? null : opt.value,
                  )
                }
                className="text-[10px]"
              >
                {opt.label}
              </Button>
            ))}
            {isDesktop && (
              <div className="text-[10px] text-muted-foreground font-mono ml-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span>&#x2318;</span>Enter
                </kbd>
                &nbsp;to submit
              </div>
            )}
          </div>

          <Button
            disabled={isDisabled}
            className={cn(
              "size-8 rounded-full shrink-0",
              isDisabled && "bg-muted-foreground border"
            )}
          >
            {isSending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
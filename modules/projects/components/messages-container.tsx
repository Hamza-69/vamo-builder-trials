import { MessageCard } from "./message-card"
import { MessageForm } from "./message-form"
import { useEffect, useRef } from "react"
import { MessageLoading } from "./message-loading"


interface Props {
  projectId: string
}

export const MessagesContainer = ({projectId}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastAssistantMessageIdRef = useRef<string | null>(null)

  const messages = [
    {
      id: "2",
      content: "I need help with my project.",
      role: "USER" as "ASSISTANT" | "USER",
      createdAt: new Date(),
      type: "SUCCESS" as "SUCCESS" | "FAILURE"
    },
    {
      id: "1",
      content: "Hello, how can I help you today?",
      role: "ASSISTANT" as "ASSISTANT" | "USER",
      createdAt: new Date(),
      type: "SUCCESS" as "SUCCESS" | "FAILURE"
    }
  ]

  useEffect(()=> {
    const lastAssistantMessage = messages.findLast(
      (message) => message.role === "ASSISTANT"
    )
    if (lastAssistantMessage && lastAssistantMessage.id !== lastAssistantMessageIdRef.current) {
      lastAssistantMessageIdRef.current = lastAssistantMessage.id
    }
  }, [messages])

  useEffect(()=> {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages.length])
  const lastMessage = messages[messages.length -1]
  const lastMessageUser = lastMessage.role === "USER"

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              content={m.content}
              role={m.role}
              createdAt={m.createdAt}
              type= {m.type}
            />
           ))
          }
          {lastMessageUser && <MessageLoading/>}
          <div ref={bottomRef}/>
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none"/>
        <MessageForm projectId= {projectId}/>
      </div>
    </div>
  )
}
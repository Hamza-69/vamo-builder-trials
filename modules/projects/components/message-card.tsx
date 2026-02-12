import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface MessageCardProps {
  content: string;
  role: "USER" | "ASSISTANT";
  createdAt: Date;
  type: "SUCCESS" | "FAILURE";
} 

interface UserMessageProps {
  content: string
}

const UserMessage = ({content} : UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted shadow-none p-3 border-none max-w-[80%] wrap-break-word">
        {content}
      </Card>
    </div>
  )
}

interface AssistantMessage {
  content:string
  createdAt:Date
  type: "SUCCESS" | "FAILURE"
}

const AssistantMessage = ({content, createdAt, type} : AssistantMessage) => {
  return (
    <div className={cn(
      "flex flex-col group px-2 pb-4",
      type==="FAILURE" && "text-red-700 dark:text-red-500",
    )}>
      <div className="flex items-center gap-2 pl-2 mb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold leading-none">
          <span className="mt-[2px]">V</span>
        </div>
        <span className="text-sm font-medium">Vamo</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy" )}
        </span>
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <span>{content}</span>
      </div>
    </div>
  )
}

export const MessageCard = ({content, role, createdAt, type}:MessageCardProps) => {
  if (role === "ASSISTANT") {
    return(
      <AssistantMessage
        content={content}
        createdAt={createdAt}
        type={type}
      />      
    )
  }

  return (
    <UserMessage content = {content}/>
  )
}
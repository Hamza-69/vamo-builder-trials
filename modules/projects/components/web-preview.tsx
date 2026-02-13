import { useState } from "react"
import { ExternalLinkIcon, RefreshCcwIcon, MonitorIcon, TabletIcon, SmartphoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Hint } from "@/components/hints"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

interface Props {
  url: string
}

type DeviceSate = "desktop" | "tablet" | "mobile"

export function WebPreview({url}: Props) {
  const [fragmentKey, setFragmentKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [device, setDevice] = useState<DeviceSate>("desktop")

  const onRefresh = () => {
    setFragmentKey((prev) => prev+1)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(()=> setCopied(false), 5000)
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b flex bg-sidebar items-center gap-x-4">
        <Hint text="Refresh" side="bottom" align="start">
        <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
          <RefreshCcwIcon/>
        </Button>
        </Hint>

        <div className="flex items-center mx-4">
          <ToggleGroup type="single" value={device} onValueChange={(v: DeviceSate) => v && setDevice(v)}>
             <ToggleGroupItem value="desktop" size="sm">
               <MonitorIcon className="h-4 w-4" />
             </ToggleGroupItem>
             <ToggleGroupItem value="tablet" size="sm">
               <TabletIcon className="h-4 w-4" />
             </ToggleGroupItem>
             <ToggleGroupItem value="mobile" size="sm">
               <SmartphoneIcon className="h-4 w-4" />
             </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Hint text="Click to copy." side="bottom" >
          <Button size={"sm"} variant={"outline"} onClick={handleCopy} className="flex flex-1 justify-start text-start font-normal" disabled={!url || copied}>
            <span className="truncate">
              {url}
            </span>
          </Button>
        </Hint>

        <Hint text="Open in a new tab." side="bottom" align="start">
          <Button size={"sm"} disabled={!url} variant={"outline"} onClick={() => {
            if (!url) return
            window.open(url, "_blank")
          }}>
            <ExternalLinkIcon/>
        </Button>
        </Hint>
      </div>
      <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center relative">
        <iframe
          key={fragmentKey}
          className={cn(
            "border bg-background transition-all duration-300 shadow-sm",
            device === "desktop" && "w-full h-full border-none",
            device === "tablet" && "w-[768px] h-[calc(100%-2rem)] rounded-md",
            device === "mobile" && "w-[375px] h-[calc(100%-2rem)] rounded-md"
          )}
          sandbox="allow-forms allow-scripts allow-same-origin"
          loading="lazy"
          src={url}
        />
      </div>
    </div>
  )
}
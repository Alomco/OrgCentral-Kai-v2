"use client"

import * as React from "react"
import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type InfoSection = {
  label: string
  text: string
}

interface InfoButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children" | "aria-label"> {
  label: string
  sections: InfoSection[]
  side?: React.ComponentProps<typeof TooltipContent>["side"]
  align?: React.ComponentProps<typeof TooltipContent>["align"]
  sideOffset?: React.ComponentProps<typeof TooltipContent>["sideOffset"]
}

function InfoButton({
  label,
  sections,
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
  ...props
}: InfoButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn("text-muted-foreground hover:text-foreground", className)}
          aria-label={label}
          {...props}
        >
          <Info className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="max-w-[260px] space-y-2 p-3"
      >
        <div className="text-xs font-semibold text-foreground">{label}</div>
        <div className="space-y-1.5">
          {sections.map((section, index) => (
            <div key={`${section.label}-${String(index)}`} className="space-y-0.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {section.label}
              </div>
              <div className="text-xs text-popover-foreground">{section.text}</div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export { InfoButton }

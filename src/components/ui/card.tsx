import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base styling
        "flex flex-col gap-6 rounded-xl py-6",
        // Glassmorphism effect
        "bg-gradient-to-br from-white/95 via-white/90 to-white/85",
        "dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/85",
        "backdrop-blur-sm",
        // Border with theme color tint
        "border border-[hsl(var(--primary)/0.1)]",
        "dark:border-[hsl(var(--primary)/0.15)]",
        // Shadow with theme color
        "shadow-lg shadow-[hsl(var(--primary)/0.05)]",
        "dark:shadow-[hsl(var(--primary)/0.1)]",
        // Text
        "text-card-foreground",
        // Hover effects
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.1)]",
        "hover:border-[hsl(var(--primary)/0.2)]",
        className
      )}
      {...props}
    />
  )
}


function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

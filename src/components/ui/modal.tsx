"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

type ModalSide = "center" | "right" | "left" | "top" | "bottom"
type ModalSize = "sm" | "md" | "lg" | "xl"

export function Modal({ modal = true, ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root data-slot="modal" modal={modal} {...props} />
}

export function ModalTrigger({
  ...props
}: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="modal-trigger" {...props} />
}

export function ModalClose({
  ...props
}: React.ComponentProps<typeof Dialog.Close>) {
  return <Dialog.Close data-slot="modal-close" {...props} />
}

export function ModalPortal({
  ...props
}: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal data-slot="modal-portal" {...props} />
}

export function ModalOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-(--z-overlay) bg-black/40 backdrop-blur-[var(--ui-backdrop-blur)] backdrop-saturate-90",
        className
      )}
      {...props}
    />
  )
}

export function ModalContent({
  className,
  bodyClassName,
  children,
  side = "center",
  size = "lg",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & {
  side?: ModalSide
  size?: ModalSize
  bodyClassName?: string
}) {
  const centerSizes: Record<ModalSize, string> = {
    sm: "w-[min(640px,calc(100%-2rem))]",
    md: "w-[min(760px,calc(100%-2rem))]",
    lg: "w-[min(880px,calc(100%-2rem))]",
    xl: "w-[min(1040px,calc(100%-2rem))]",
  }

  return (
    <ModalPortal>
      <ModalOverlay />
      <Dialog.Content
        data-slot="dialog-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-(--z-modal) flex min-h-0 max-h-[calc(90vh-2rem)] flex-col overflow-hidden bg-[oklch(var(--popover))] border border-[oklch(var(--border)/var(--ui-border-opacity))] p-0 shadow-[var(--ui-surface-item-shadow)] transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--primary)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          side === "center" &&
          cn(
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            centerSizes[size]
          ),
          side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 w-full rounded-b-xl border-b",
          side === "bottom" &&
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 w-full rounded-t-xl border-t",
          className
        )}
        {...props}
      >
        <div
          data-slot="modal-body"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain",
            bodyClassName
          )}
        >
          {children}
        </div>
      </Dialog.Content>
    </ModalPortal>
  )
}

export function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

export function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

export function ModalTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="dialog-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

export function ModalDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

'use client'

import Link from 'next/link'

import { SidebarMenuButton, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

import type { NavItem } from './app-sidebar-nav'

const activeIconTileClassName =
    'bg-sidebar-primary/20 text-sidebar-primary-foreground ring-1 ring-primary/25'

export function StandardNavItem({ item, isActive, open, isSubItem = false }: {
    item: NavItem
    isActive: boolean
    open: boolean
    isSubItem?: boolean
}) {
    const Icon = item.icon
    const ButtonComponent = isSubItem ? SidebarMenuSubButton : SidebarMenuButton

    return (
        <ButtonComponent
            asChild
            isActive={isActive}
            tooltip={item.label}
            className={cn(
                'w-full justify-start rounded-lg transition-all duration-200 ease-in-out group/navitem h-auto',
                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
                isActive &&
                'relative bg-sidebar-accent/40 ring-1 ring-sidebar-border/60 before:absolute before:inset-y-2 before:left-2 before:w-1 before:rounded-full before:bg-primary/40',
                !isActive &&
                'hover:bg-sidebar-accent/30'
            )}
        >
            <Link
                href={item.href}
                className={cn(
                    'flex items-center gap-3 w-full transition-all duration-300',
                    'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2.5',
                    'px-3 py-2.5'
                )}
            >
                <div
                    className={cn(
                        'flex items-center justify-center rounded-lg shrink-0 transition-all duration-300',
                        'group-hover/navitem:bg-sidebar-accent/40',
                        isSubItem ? 'w-8 h-8' : !open ? 'w-10 h-10' : 'w-9 h-9',
                        'group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10',
                        isActive
                            ? activeIconTileClassName
                            : 'bg-sidebar-accent/30 text-sidebar-foreground/70 group-hover/navitem:bg-sidebar-accent/45 group-hover/navitem:text-sidebar-foreground'
                    )}
                >
                    <Icon
                        className={cn(
                            'shrink-0 transition-all duration-300',
                            isSubItem ? 'h-4 w-4' : 'h-5 w-5',
                            'group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                            isActive && 'text-sidebar-foreground'
                        )}
                    />
                </div>
                <span
                    className={cn(
                        'group-data-[collapsible=icon]:hidden text-sm transition-all duration-300',
                        !isSubItem && 'font-medium',
                        isSubItem && 'font-normal text-sidebar-foreground/80',
                        isActive && !isSubItem && 'text-sidebar-foreground font-semibold',
                        isActive && isSubItem && 'text-sidebar-foreground font-medium'
                    )}
                >
                    {item.label}
                </span>
                {item.badge ? (
                    <span
                        className={cn(
                            'ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground',
                            'group-data-[collapsible=icon]:hidden',
                            'animate-pulse hover:animate-none hover:scale-110 transition-transform duration-300'
                        )}
                    >
                        {item.badge}
                    </span>
                ) : null}
            </Link>
        </ButtonComponent>
    )
}

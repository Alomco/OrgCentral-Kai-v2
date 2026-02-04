'use client'

import Link from 'next/link'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

import type { NavItem } from './app-sidebar-nav'
import { StandardNavItem } from './app-sidebar-standard-nav-item'

interface AppSidebarNavItemProps {
    item: NavItem
    pathname: string
    open: boolean
    isSubItem?: boolean
}

interface SharedNavState {
    pathname: string
    open: boolean
}

interface NavItemRenderProps extends SharedNavState {
    item: NavItem
    isActive: boolean
}

const activeIconTileClassName =
    'bg-sidebar-primary/20 text-sidebar-primary-foreground ring-1 ring-primary/25'

const inactiveIconTileClassName =
    'bg-sidebar-accent/30 text-sidebar-foreground/70 group-hover/navitem:bg-sidebar-accent/45 group-hover/navitem:text-sidebar-foreground'

function CollapsedAccordionNavItem({ item, isActive }: NavItemRenderProps) {
    const Icon = item.icon

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                    isActive={isActive}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                        'w-full justify-center rounded-lg transition-all duration-300 ease-in-out group/navitem h-auto',
                        'group-data-[collapsible=icon]:justify-center',
                        isActive &&
                        'bg-sidebar-accent/40 ring-1 ring-sidebar-border/60',
                        !isActive &&
                        'hover:bg-sidebar-accent/30'
                    )}
                >
                    <div className="flex w-full items-center justify-center">
                        <div
                            className={cn(
                                'flex items-center justify-center rounded-lg shrink-0 transition-all duration-300',
                                'group-hover/navitem:bg-sidebar-accent/40',
                                'w-10 h-10',
                                isActive
                                    ? activeIconTileClassName
                                    : inactiveIconTileClassName
                            )}
                        >
                            <Icon className="h-5 w-5 transition-all duration-300" />
                        </div>
                    </div>
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56" side="right" align="start" sideOffset={8}>
                <DropdownMenuItem asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                    </Link>
                </DropdownMenuItem>
                {item.subItems?.map((subItem) => {
                    const SubIcon = subItem.icon
                    return (
                        <DropdownMenuItem key={subItem.href} asChild>
                            <Link href={subItem.href} className="flex items-center gap-2">
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                            </Link>
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ExpandedAccordionNavItem({ item, isActive, pathname, open }: NavItemRenderProps) {
    const Icon = item.icon

    return (
        <AccordionItem value={item.href} className="border-b-0">
            <AccordionTrigger
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'transition-all duration-300 ease-in-out',
                    'hover:bg-sidebar-accent/30',
                    'group/nav',
                    '[&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-300',
                    isActive &&
                    'relative bg-sidebar-accent/40 ring-1 ring-sidebar-border/60 before:absolute before:inset-y-2 before:left-2 before:w-1 before:rounded-full before:bg-primary/40'
                )}
            >
                <div className="flex flex-1 items-center gap-3">
                    <div
                        className={cn(
                            'flex items-center justify-center rounded-lg transition-all duration-300 shrink-0',
                            'w-9 h-9 group-hover/nav:bg-sidebar-accent/40',
                            isActive
                                ? activeIconTileClassName
                                : 'bg-sidebar-accent/30 text-sidebar-foreground/70 group-hover/nav:bg-sidebar-accent/45 group-hover/nav:text-sidebar-foreground'
                        )}
                    >
                        <Icon className="h-5 w-5 transition-all duration-300" />
                    </div>
                    <span
                        className={cn(
                            'text-sm font-medium transition-all duration-300',
                            isActive && 'text-sidebar-foreground'
                        )}
                    >
                        {item.label}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent
                className={cn(
                    'pb-2 pt-2',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    'data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2'
                )}
            >
                <SidebarMenu
                    className={cn(
                        'space-y-1.5 ml-3 pl-4 relative',
                        'before:absolute before:inset-y-1 before:left-1 before:w-px',
                        'before:bg-sidebar-border/40'
                    )}
                >
                    {item.subItems?.map((subItem, index) => (
                        <SidebarMenuItem
                            key={subItem.href}
                            className={cn(
                                'animate-in slide-in-from-left-2 fade-in-0',
                                'transition-all duration-300'
                            )}
                            style={{ animationDelay: `${String(index * 50)}ms` }}
                        >
                            <AppSidebarNavItem item={subItem} pathname={pathname} open={open} isSubItem />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </AccordionContent>
        </AccordionItem>
    )
}

export function AppSidebarNavItem({
    item,
    pathname,
    open,
    isSubItem = false,
}: AppSidebarNavItemProps) {
    const isActive =
        pathname === item.href ||
        (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1)

    if (item.isAccordion && item.subItems) {
        // When collapsed, use a popout menu so sub-pages remain reachable.
        if (!open) {
            return <CollapsedAccordionNavItem item={item} isActive={isActive} pathname={pathname} open={open} />
        }

        // When expanded, render as accordion
        return (
            <ExpandedAccordionNavItem
                item={item}
                isActive={isActive}
                pathname={pathname}
                open={open}
            />
        )
    }

    return <StandardNavItem item={item} isActive={isActive} open={open} isSubItem={isSubItem} />
}

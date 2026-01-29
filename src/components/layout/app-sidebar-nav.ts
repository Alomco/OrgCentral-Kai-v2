import {
    BarChart3,
    Building,
    CalendarDays,
    FileText,
    LayoutDashboard,
    Settings,
    Shield,
    User,
    Users,
} from "lucide-react"

import type { ElementType } from "react"

export interface NavItem {
    href: string
    label: string
    icon: ElementType
    subItems?: NavItem[]
    isAccordion?: boolean
    badge?: string
}

export const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
        href: "/hr",
        label: "HR Management",
        icon: Users,
        isAccordion: true,
        subItems: [
            { href: "/hr/dashboard", label: "HR Dashboard", icon: LayoutDashboard },
            { href: "/hr/profile", label: "My Profile", icon: User },
            { href: "/hr/leave", label: "Leave Management", icon: CalendarDays },
            { href: "/hr/absence", label: "Absence", icon: CalendarDays },
            { href: "/hr/employees", label: "Employees", icon: Users },
            { href: "/hr/policies", label: "Policies", icon: FileText },
            { href: "/hr/compliance", label: "Compliance", icon: Shield },
            { href: "/hr/performance", label: "Performance", icon: BarChart3 },
        ],
    },
    {
        href: "/org",
        label: "Organization",
        icon: Building,
        isAccordion: true,
        subItems: [
            { href: "/org/profile", label: "Profile", icon: Building },
            { href: "/org/members", label: "Members", icon: Users },
            { href: "/org/roles", label: "Roles", icon: Shield },
            { href: "/org/audit", label: "Audit Log", icon: FileText },
            { href: "/org/branding", label: "Branding", icon: FileText },
            { href: "/org/settings", label: "Settings", icon: Settings },
        ],
    },
    { href: "/org/settings", label: "Settings", icon: Settings },
]

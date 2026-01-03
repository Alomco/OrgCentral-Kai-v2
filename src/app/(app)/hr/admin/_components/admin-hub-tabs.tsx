'use client';

/**
 * Admin Hub Tabs - Client Island for tab navigation
 * Single Responsibility: Interactive tab switching with URL state
 */

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    CalendarDaysIcon, 
    AlertCircleIcon, 
    UsersIcon, 
    ShieldCheckIcon 
} from 'lucide-react';

import type { AdminHubTab, AdminHubTabId } from '../_types';

const ADMIN_TABS: AdminHubTab[] = [
    { 
        id: 'leave', 
        label: 'Leave', 
        icon: <CalendarDaysIcon className="h-4 w-4" />,
        description: 'Manage leave requests and approvals',
    },
    { 
        id: 'absences', 
        label: 'Absences', 
        icon: <AlertCircleIcon className="h-4 w-4" />,
        description: 'Review and acknowledge unplanned absences',
    },
    { 
        id: 'employees', 
        label: 'Employees', 
        icon: <UsersIcon className="h-4 w-4" />,
        description: 'Employee directory and onboarding',
    },
    { 
        id: 'compliance', 
        label: 'Compliance', 
        icon: <ShieldCheckIcon className="h-4 w-4" />,
        description: 'Compliance review queue and templates',
    },
];

export interface AdminHubTabsProps {
    defaultTab?: AdminHubTabId;
}

export function AdminHubTabs({ defaultTab = 'leave' }: AdminHubTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const activeTab = useMemo(() => {
        const tabParameter = searchParams.get('tab');
        if (tabParameter && isValidTab(tabParameter)) {
            return tabParameter;
        }
        return defaultTab;
    }, [searchParams, defaultTab]);

    const handleTabChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                {ADMIN_TABS.map((tab) => (
                    <TabsTrigger 
                        key={tab.id} 
                        value={tab.id}
                        className="gap-2 data-[state=active]:bg-primary/10"
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

function isValidTab(value: string): value is AdminHubTabId {
    return ['leave', 'absences', 'employees', 'compliance'].includes(value);
}

export { ADMIN_TABS };
export type { AdminHubTabId };

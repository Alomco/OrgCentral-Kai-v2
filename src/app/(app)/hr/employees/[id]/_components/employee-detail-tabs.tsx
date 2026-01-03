import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const EMPLOYEE_DETAIL_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'time-off', label: 'Time off' },
    { id: 'development', label: 'Development' },
    { id: 'checklists', label: 'Checklists' },
    { id: 'contract', label: 'Contract' },
    { id: 'lifecycle', label: 'Lifecycle' },
] as const;

export type EmployeeDetailTabId = (typeof EMPLOYEE_DETAIL_TABS)[number]['id'];

export function resolveEmployeeDetailTab(value: string | undefined): EmployeeDetailTabId | null {
    if (!value) {
        return null;
    }
    return EMPLOYEE_DETAIL_TABS.some((tab) => tab.id === value) ? (value as EmployeeDetailTabId) : null;
}

export function buildEmployeeDetailTabHref(profileId: string, tab: EmployeeDetailTabId): string {
    if (tab === 'overview') {
        return `/hr/employees/${profileId}`;
    }
    return `/hr/employees/${profileId}?tab=${tab}`;
}

export interface EmployeeDetailTabsProps {
    profileId: string;
    activeTab: EmployeeDetailTabId;
}

export function EmployeeDetailTabs({ profileId, activeTab }: EmployeeDetailTabsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {EMPLOYEE_DETAIL_TABS.map((tab) => (
                <Button
                    key={tab.id}
                    asChild
                    size="sm"
                    variant={tab.id === activeTab ? 'default' : 'outline'}
                >
                    <Link href={buildEmployeeDetailTabHref(profileId, tab.id)}>
                        {tab.label}
                    </Link>
                </Button>
            ))}
        </div>
    );
}

import Link from 'next/link';
import {
    Users,
    UserPlus,
    Settings,
    FileText,
    ShieldCheck,
    Calendar,
    Clock,
    BookOpen,
    ClipboardList,
    BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoButton, type InfoSection } from '@/components/ui/info-button';

interface QuickAction {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    info: InfoSection[];
}

const ADMIN_QUICK_ACTIONS: QuickAction[] = [
    {
        href: '/hr/employees',
        label: 'Employee Directory',
        icon: Users,
        description: 'View the full employee list',
        info: [
            { label: 'What', text: 'Search and review employee profiles.' },
            { label: 'Prereqs', text: 'HR admin access to employee data.' },
            { label: 'Next', text: 'Open a profile to review status.' },
            { label: 'Compliance', text: 'Access is logged for audit.' },
        ],
    },
    {
        href: '/hr/onboarding',
        label: 'Onboarding',
        icon: UserPlus,
        description: 'Start and track new hire tasks',
        info: [
            { label: 'What', text: 'Manage onboarding tasks and checklists.' },
            { label: 'Prereqs', text: 'Onboarding workflows enabled.' },
            { label: 'Next', text: 'Assign tasks and monitor completion.' },
            { label: 'Compliance', text: 'Onboarding events are audited.' },
        ],
    },
    {
        href: '/hr/offboarding',
        label: 'Offboarding',
        icon: ClipboardList,
        description: 'Track exit checklists and progress',
        info: [
            { label: 'What', text: 'Coordinate exit tasks and access removal.' },
            { label: 'Prereqs', text: 'Offboarding workflows enabled.' },
            { label: 'Next', text: 'Complete checklists before final day.' },
            { label: 'Compliance', text: 'Offboarding actions are logged.' },
        ],
    },
    {
        href: '/hr/leave',
        label: 'Leave Management',
        icon: Calendar,
        description: 'Review and approve leave requests',
        info: [
            { label: 'What', text: 'Approve or deny employee leave requests.' },
            { label: 'Prereqs', text: 'Leave policies configured.' },
            { label: 'Next', text: 'Review pending requests and update status.' },
            { label: 'Compliance', text: 'Decisions are recorded for audit.' },
        ],
    },
    {
        href: '/hr/reports',
        label: 'Reports',
        icon: BarChart3,
        description: 'View HR reports and metrics',
        info: [
            { label: 'What', text: 'Access HR analytics and summaries.' },
            { label: 'Prereqs', text: 'Report access permissions.' },
            { label: 'Next', text: 'Export or share key metrics.' },
            { label: 'Compliance', text: 'Reports respect classification rules.' },
        ],
    },
    {
        href: '/hr/compliance',
        label: 'Compliance',
        icon: ShieldCheck,
        description: 'Track compliance tasks and deadlines',
        info: [
            { label: 'What', text: 'Monitor compliance controls and evidence.' },
            { label: 'Prereqs', text: 'Compliance controls configured.' },
            { label: 'Next', text: 'Resolve overdue items.' },
            { label: 'Compliance', text: 'Actions align to audit requirements.' },
        ],
    },
    {
        href: '/hr/time-tracking',
        label: 'Time Tracking',
        icon: Clock,
        description: 'Review timesheets and hours',
        info: [
            { label: 'What', text: 'Review time entries and approvals.' },
            { label: 'Prereqs', text: 'Time tracking enabled.' },
            { label: 'Next', text: 'Approve or request corrections.' },
            { label: 'Compliance', text: 'Edits are logged with reasons.' },
        ],
    },
    {
        href: '/hr/training',
        label: 'Training',
        icon: BookOpen,
        description: 'Manage training and certifications',
        info: [
            { label: 'What', text: 'Assign and track required training.' },
            { label: 'Prereqs', text: 'Training catalog configured.' },
            { label: 'Next', text: 'Check completion and due dates.' },
            { label: 'Compliance', text: 'Completion records are auditable.' },
        ],
    },
    {
        href: '/hr/policies',
        label: 'Policies',
        icon: FileText,
        description: 'View and publish HR policies',
        info: [
            { label: 'What', text: 'Manage policy content and publishing.' },
            { label: 'Prereqs', text: 'Policy permissions required.' },
            { label: 'Next', text: 'Publish updates and notify staff.' },
            { label: 'Compliance', text: 'Policy changes are versioned.' },
        ],
    },
    {
        href: '/hr/performance',
        label: 'Performance',
        icon: ClipboardList,
        description: 'Manage reviews and goals',
        info: [
            { label: 'What', text: 'Track performance cycles and goals.' },
            { label: 'Prereqs', text: 'Performance workflows enabled.' },
            { label: 'Next', text: 'Schedule reviews and set objectives.' },
            { label: 'Compliance', text: 'Review actions are logged.' },
        ],
    },
    {
        href: '/hr/settings',
        label: 'HR Settings',
        icon: Settings,
        description: 'Configure defaults and integrations',
        info: [
            { label: 'What', text: 'Set HR defaults and integrations.' },
            { label: 'Prereqs', text: 'HR settings access.' },
            { label: 'Next', text: 'Review security and notification settings.' },
            { label: 'Compliance', text: 'Changes are audited.' },
        ],
    },
];

/**
 * Quick actions grid for HR admin dashboard
 */
export function HrAdminQuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span>Quick Actions</span>
                    <InfoButton
                        label="HR quick actions"
                        sections={[
                            { label: 'What', text: 'Shortcuts to common HR workflows.' },
                            { label: 'Prereqs', text: 'HR admin access to each module.' },
                            { label: 'Next', text: 'Open a workflow and complete tasks.' },
                            { label: 'Compliance', text: 'Actions are audited.' },
                        ]}
                    />
                </CardTitle>
                <CardDescription>Navigate to HR management areas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ADMIN_QUICK_ACTIONS.map((action) => (
                        <div
                            key={action.href}
                            className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted hover:shadow-sm"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <action.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={action.href}
                                    className="font-medium text-sm truncate"
                                    title={action.label}
                                    aria-label={`Open ${action.label}`}
                                >
                                    {action.label}
                                </Link>
                                <div className="text-xs text-muted-foreground line-clamp-2" title={action.description}>
                                    {action.description}
                                </div>
                            </div>
                            <InfoButton label={action.label} sections={action.info} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

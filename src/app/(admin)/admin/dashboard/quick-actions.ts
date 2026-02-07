import { Building2, Database, LifeBuoy, Settings, ShieldUser, UserPlus } from 'lucide-react';

import type { InfoSection } from '@/components/ui/info-button';

interface AdminQuickAction {
    title: string;
    description: string;
    href: string;
    icon: typeof Building2;
    info: InfoSection[];
}

export const QUICK_ACTIONS: AdminQuickAction[] = [
    {
        title: 'Review tenants',
        description: 'Approve or suspend tenants',
        href: '/admin/global/tenant-management',
        icon: Building2,
        info: [
            { label: 'What', text: 'Review tenant status and access controls.' },
            { label: 'Prereqs', text: 'Platform tenant access; break-glass for changes.' },
            { label: 'Next', text: 'Open a tenant and act on risk.' },
            { label: 'Compliance', text: 'Actions are audited and policy scoped.' },
        ],
    },
    {
        title: 'Support tickets',
        description: 'Triage platform escalations',
        href: '/admin/global/support-tickets',
        icon: LifeBuoy,
        info: [
            { label: 'What', text: 'Triage platform support tickets.' },
            { label: 'Prereqs', text: 'Platform support access and tenant context.' },
            { label: 'Next', text: 'Confirm severity and assign an owner.' },
            { label: 'Compliance', text: 'Updates are logged with SLA impact.' },
        ],
    },
    {
        title: 'Impersonation',
        description: 'Request time-boxed access',
        href: '/admin/global/user-impersonation',
        icon: ShieldUser,
        info: [
            { label: 'What', text: 'Start a supervised, time-limited support session.' },
            { label: 'Prereqs', text: 'Break-glass approval, MFA, allowlisted IP.' },
            { label: 'Next', text: 'Request access, then approve and monitor.' },
            { label: 'Compliance', text: 'Sessions are audited and auto-expire.' },
        ],
    },
    {
        title: 'Invite member',
        description: 'Add a user and assign access',
        href: '/org/members',
        icon: UserPlus,
        info: [
            { label: 'What', text: 'Invite a new member and set role.' },
            { label: 'Prereqs', text: 'Member management access and valid email.' },
            { label: 'Next', text: 'Assign least-privilege roles before sending.' },
            { label: 'Compliance', text: 'Invites and role changes are audited.' },
        ],
    },
    {
        title: 'Manage org settings',
        description: 'Update policies and preferences',
        href: '/org/settings',
        icon: Settings,
        info: [
            { label: 'What', text: 'Update org policies, defaults, integrations.' },
            { label: 'Prereqs', text: 'Org management access.' },
            { label: 'Next', text: 'Review security defaults before saving.' },
            { label: 'Compliance', text: 'Sensitive changes are audited.' },
        ],
    },
    {
        title: 'Cold start seeder',
        description: 'Seed essentials and demo data',
        href: '/admin/cold-start',
        icon: Database,
        info: [
            { label: 'What', text: 'Seed platform essentials and optional demo data.' },
            { label: 'Prereqs', text: 'Org access and seeder permission.' },
            { label: 'Next', text: 'Pick datasets, then run and review summary.' },
            { label: 'Compliance', text: 'Seed actions are logged with provenance.' },
        ],
    },
] as const;

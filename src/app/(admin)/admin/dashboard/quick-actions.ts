import { Building2, Database, LifeBuoy, Settings, ShieldUser, UserPlus } from 'lucide-react';

export const QUICK_ACTIONS = [
    {
        title: 'Review tenants',
        description: 'Approve or suspend tenants',
        href: '/admin/global/tenant-management',
        icon: Building2,
    },
    {
        title: 'Support tickets',
        description: 'Triage platform escalations',
        href: '/admin/global/support-tickets',
        icon: LifeBuoy,
    },
    {
        title: 'Impersonation',
        description: 'Request time-boxed access',
        href: '/admin/global/user-impersonation',
        icon: ShieldUser,
    },
    {
        title: 'Invite member',
        description: 'Add a user and assign access',
        href: '/org/members',
        icon: UserPlus,
    },
    {
        title: 'Manage org settings',
        description: 'Update policies and preferences',
        href: '/org/settings',
        icon: Settings,
    },
    {
        title: 'Cold start seeder',
        description: 'Seed essentials and demo data',
        href: '/admin/cold-start',
        icon: Database,
    },
] as const;

import { Database, FileText, KeyRound, Settings, UserPlus } from 'lucide-react';

export const QUICK_ACTIONS = [
    {
        title: 'Invite member',
        description: 'Add a user and assign access',
        href: '/org/members',
        icon: UserPlus,
    },
    {
        title: 'Review roles',
        description: 'Audit role assignments',
        href: '/org/roles',
        icon: KeyRound,
    },
    {
        title: 'View audit log',
        description: 'Track critical admin activity',
        href: '/org/permissions',
        icon: FileText,
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

import type { SeedCategoryDefinition, SeedCategoryId, SeedSummaryCounts } from '@/server/types/seeder/cold-start';

export const SEED_CATEGORY_DEFINITIONS: readonly SeedCategoryDefinition[] = [
    {
        id: 'roles',
        group: 'platform',
        label: 'Tenant roles',
        description: 'Seed default role templates for the organization.',
    },
    {
        id: 'permissions',
        group: 'platform',
        label: 'Permission resources',
        description: 'Register permission resources used by RBAC/ABAC policies.',
    },
    {
        id: 'starter',
        group: 'platform',
        label: 'HR starter kit',
        description: 'Seed absence types, default policies, and departments.',
    },
    {
        id: 'leave-policies',
        group: 'platform',
        label: 'Common leave policies',
        description: 'Seed common policy templates beyond the starter kit.',
    },
    {
        id: 'compliance-templates',
        group: 'platform',
        label: 'Compliance templates',
        description: 'Seed default compliance templates and categories.',
    },
    {
        id: 'employees',
        group: 'demo',
        label: 'Employees',
        description: 'Create demo employee profiles and memberships.',
        count: {
            min: 1,
            max: 200,
            defaults: { minimal: 5, full: 25 },
        },
    },
    {
        id: 'absences',
        group: 'demo',
        label: 'Absences',
        description: 'Generate unplanned absence records.',
        requiresEmployees: true,
        count: {
            min: 1,
            max: 500,
            defaults: { minimal: 8, full: 40 },
        },
    },
    {
        id: 'time-entries',
        group: 'demo',
        label: 'Time entries',
        description: 'Seed time tracking entries for members.',
        requiresEmployees: true,
        count: {
            min: 1,
            max: 500,
            defaults: { minimal: 12, full: 60 },
        },
    },
    {
        id: 'training',
        group: 'demo',
        label: 'Training',
        description: 'Create training records for employees.',
        requiresEmployees: true,
        count: {
            min: 1,
            max: 200,
            defaults: { minimal: 6, full: 30 },
        },
    },
    {
        id: 'performance',
        group: 'demo',
        label: 'Performance reviews',
        description: 'Seed performance review records.',
        requiresEmployees: true,
        count: {
            min: 1,
            max: 200,
            defaults: { minimal: 4, full: 20 },
        },
    },
    {
        id: 'notifications',
        group: 'demo',
        label: 'Notifications',
        description: 'Create sample user notifications.',
        count: {
            min: 1,
            max: 500,
            defaults: { minimal: 10, full: 60 },
        },
    },
    {
        id: 'security-events',
        group: 'demo',
        label: 'Security events',
        description: 'Generate security event logs.',
        count: {
            min: 1,
            max: 1000,
            defaults: { minimal: 10, full: 80 },
        },
    },
    {
        id: 'billing',
        group: 'demo',
        label: 'Billing records',
        description: 'Seed subscriptions, invoices, and payment data.',
    },
    {
        id: 'org-assets',
        group: 'demo',
        label: 'Org assets',
        description: 'Create locations and HR policies.',
    },
    {
        id: 'compliance',
        group: 'demo',
        label: 'Compliance data',
        description: 'Seed compliance checklists and assignments.',
        requiresEmployees: true,
    },
    {
        id: 'integrations',
        group: 'demo',
        label: 'Integrations',
        description: 'Create integration placeholders.',
    },
] as const;

export const SEED_CATEGORY_MAP: Record<SeedCategoryId, SeedCategoryDefinition> = SEED_CATEGORY_DEFINITIONS.reduce(
    (accumulator, category) => {
        accumulator[category.id] = category;
        return accumulator;
    },
    {} as Record<SeedCategoryId, SeedCategoryDefinition>,
);

export function createEmptySeedSummaryCounts(): SeedSummaryCounts {
    return {
        roles: 0,
        permissions: 0,
        starter: 0,
        'leave-policies': 0,
        'compliance-templates': 0,
        employees: 0,
        absences: 0,
        'time-entries': 0,
        training: 0,
        performance: 0,
        notifications: 0,
        'security-events': 0,
        billing: 0,
        'org-assets': 0,
        compliance: 0,
        integrations: 0,
    };
}

import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';

export interface PermissionResourceSeed {
    resource: string;
    actions: string[];
    description?: string;
    legacyKeys?: string[];
}

export const DEFAULT_PERMISSION_RESOURCE_SEEDS: readonly PermissionResourceSeed[] = [
    {
        resource: 'hr.absence',
        actions: ['read', 'list', 'create', 'update', 'delete', 'acknowledge', 'cancel'],
        description: 'Unplanned absence records and lifecycle actions.',
        legacyKeys: ['hrAbsence'],
    },
    {
        resource: 'hr.absence.settings',
        actions: ['read', 'update'],
        description: 'Absence configuration (types, rules).',
        legacyKeys: ['hrAbsenceSettings'],
    },
    {
        resource: 'hr.absence.attachment',
        actions: ['create', 'delete'],
        description: 'Absence evidence and attachments.',
        legacyKeys: ['hrAbsence'],
    },
    {
        resource: 'hr.compliance.item',
        actions: ['read', 'list', 'create', 'update', 'delete', 'review', 'assign'],
        description: 'Compliance assignments and documents.',
        legacyKeys: ['hrCompliance'],
    },
    {
        resource: 'hr.compliance.template',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Compliance templates and library.',
        legacyKeys: ['hrComplianceTemplate'],
    },
    {
        resource: 'hr.compliance.review',
        actions: ['review'],
        description: 'Compliance review queue actions.',
        legacyKeys: ['hrCompliance'],
    },
    {
        resource: 'hr.leave.request',
        actions: ['read', 'list', 'create', 'update', 'delete', 'approve', 'reject', 'cancel'],
        description: 'Leave requests lifecycle actions.',
        legacyKeys: ['hrLeave'],
    },
    {
        resource: 'hr.leave.balance',
        actions: ['read', 'adjust'],
        description: 'Leave balance adjustments and visibility.',
        legacyKeys: ['hrLeaveBalance'],
    },
    {
        resource: 'hr.leave.policy',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Leave policy configuration.',
        legacyKeys: ['hrLeavePolicy'],
    },
    {
        resource: 'hr.leave.type',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Leave type catalog and settings.',
        legacyKeys: ['hrLeavePolicy'],
    },
    {
        resource: 'hr.notification',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'HR notifications lifecycle.',
        legacyKeys: ['hrNotification'],
    },
    {
        resource: 'hr.reminder',
        actions: ['read', 'list', 'create', 'update'],
        description: 'Reminder scheduling and updates.',
        legacyKeys: ['hrNotification'],
    },
    {
        resource: 'hr.onboarding.invite',
        actions: ['read', 'send'],
        description: 'Onboarding invitations management.',
        legacyKeys: ['hrOnboarding'],
    },
    {
        resource: 'hr.onboarding.task',
        actions: ['read', 'list', 'create', 'update', 'delete', 'complete'],
        description: 'Onboarding tasks and assignments.',
        legacyKeys: ['hrOnboarding'],
    },
    {
        resource: 'hr.onboarding.checklist',
        actions: ['read', 'update', 'complete'],
        description: 'Onboarding checklist instances.',
        legacyKeys: ['hrOnboarding'],
    },
    {
        resource: 'hr.checklist.template',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Checklist templates library.',
        legacyKeys: ['hrChecklistTemplate'],
    },
    {
        resource: 'hr.people.profile',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Employee profiles and directory.',
        legacyKeys: ['employeeProfile'],
    },
    {
        resource: 'hr.people.contract',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Employment contracts and history.',
        legacyKeys: ['employmentContract'],
    },
    {
        resource: 'hr.performance.review',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Performance reviews and appraisals.',
        legacyKeys: ['hrPerformance'],
    },
    {
        resource: 'hr.performance.goal',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Performance goals and updates.',
        legacyKeys: ['hrPerformanceGoal'],
    },
    {
        resource: 'hr.performance.feedback',
        actions: ['create', 'update'],
        description: 'Performance feedback entries.',
        legacyKeys: ['hrPerformance'],
    },
    {
        resource: 'hr.policy',
        actions: ['read', 'list', 'create', 'update', 'delete', 'publish', 'unpublish'],
        description: 'HR policy (handbook) administration.',
        legacyKeys: ['hrPolicy'],
    },
    {
        resource: 'hr.policy.acknowledgment',
        actions: ['acknowledge'],
        description: 'Policy acknowledgment tracking.',
        legacyKeys: ['hrPolicy'],
    },
    {
        resource: 'hr.settings',
        actions: ['read', 'update'],
        description: 'HR module configuration.',
        legacyKeys: ['hrSettings'],
    },
    {
        resource: 'org.settings',
        actions: ['create', 'read', 'update', 'delete', 'governance'],
        description: 'Organization-wide settings.',
        legacyKeys: ['organization'],
    },
    {
        resource: 'hr.time.entry',
        actions: ['read', 'list', 'create', 'update', 'delete', 'approve'],
        description: 'Time entry logging and approvals.',
        legacyKeys: ['hrTimeEntry'],
    },
    {
        resource: 'hr.time.sheet',
        actions: ['read', 'list', 'approve'],
        description: 'Timesheet summaries and approvals.',
        legacyKeys: ['hrTimeEntry'],
    },
    {
        resource: 'hr.training.record',
        actions: ['read', 'list', 'create', 'update', 'delete'],
        description: 'Training records and completions.',
        legacyKeys: ['hrTraining'],
    },
    {
        resource: 'hr.training.enrollment',
        actions: ['enroll', 'complete'],
        description: 'Training enrollments and progress.',
        legacyKeys: ['hrTraining'],
    },
] as const;

export interface SeedPermissionResourcesDependencies {
    permissionResourceRepository: Pick<IPermissionResourceRepository, 'listResources' | 'createResource'>;
}

export interface SeedPermissionResourcesInput {
    orgId: string;
}

export async function seedPermissionResources(
    deps: SeedPermissionResourcesDependencies,
    input: SeedPermissionResourcesInput,
): Promise<void> {
    const existing = await deps.permissionResourceRepository.listResources(input.orgId);
    const existingResources = new Set(existing.map((resource) => resource.resource));

    for (const seed of DEFAULT_PERMISSION_RESOURCE_SEEDS) {
        if (existingResources.has(seed.resource)) {
            continue;
        }

        await deps.permissionResourceRepository.createResource(input.orgId, {
            orgId: input.orgId,
            resource: seed.resource,
            actions: dedupe(seed.actions),
            description: seed.description,
            metadata: seed.legacyKeys?.length ? { legacyKeys: seed.legacyKeys } : undefined,
        });
    }
}

function dedupe(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0)));
}

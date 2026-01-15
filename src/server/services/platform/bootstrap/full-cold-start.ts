import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import { runColdStart, type ColdStartConfig, type ColdStartResult } from './cold-start-service';
import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import { buildRoleServiceDependencies } from '@/server/repositories/providers/org/role-service-dependencies';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import { buildAbsenceTypeConfigDependencies } from '@/server/repositories/providers/hr/absence-type-config-service-dependencies';
import { buildComplianceRepositoryDependencies } from '@/server/repositories/providers/hr/compliance-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PERMISSIONS, CACHE_SCOPE_ROLES } from '@/server/repositories/cache-scopes';
import { isOrgRoleKey, type OrgRoleKey, TENANT_ROLE_KEYS } from '@/server/security/role-constants';
import { ROLE_TEMPLATES } from '@/server/security/role-templates';
import type { Role } from '@/server/types/hr-types';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';
import { seedDefaultComplianceTemplates } from '@/server/use-cases/hr/compliance/seed-default-templates';
import { seedStarterDataInternal, seedCommonLeavePoliciesInternal } from '@/server/services/seeder/seed-starter-data';
import { seedFakeEmployeesInternal } from '@/server/services/seeder/seed-employees';
import { seedFakeAbsencesInternal } from '@/server/services/seeder/seed-absences';
import { seedFakeTimeEntriesInternal } from '@/server/services/seeder/seed-time-entries';
import { seedFakeTrainingInternal } from '@/server/services/seeder/seed-training';
import { seedFakePerformanceInternal } from '@/server/services/seeder/seed-performance';
import { seedFakeNotificationsInternal } from '@/server/services/seeder/seed-notifications';
import { seedSecurityEventsInternal } from '@/server/services/seeder/seed-security';
import { seedBillingDataInternal } from '@/server/services/seeder/seed-billing';
import { seedOrgAssetsInternal } from '@/server/services/seeder/seed-org-assets';
import { seedComplianceDataInternal } from '@/server/services/seeder/seed-compliance';
import { seedIntegrationsInternal } from '@/server/services/seeder/seed-integrations';
import { seedCurrentUserProfileInternal } from '@/server/services/seeder/seed-profile';

export interface ColdStartSeedCounts {
    employees: number;
    absences: number;
    timeEntries: number;
    training: number;
    performance: number;
    notifications: number;
    securityEvents: number;
}

export interface FullColdStartOptions {
    coldStart?: ColdStartConfig;
    includeDemoData?: boolean;
    counts?: Partial<ColdStartSeedCounts>;
    forceComplianceTemplates?: boolean;
}

export interface ColdStartStepResult {
    step: string;
    success: boolean;
    message: string;
    count?: number;
}

export interface FullColdStartResult {
    success: boolean;
    coldStart: ColdStartResult;
    steps: ColdStartStepResult[];
}

const DEFAULT_COUNTS: ColdStartSeedCounts = {
    employees: 8,
    absences: 12,
    timeEntries: 20,
    training: 10,
    performance: 5,
    notifications: 10,
    securityEvents: 20,
};

export async function runFullColdStart(options: FullColdStartOptions = {}): Promise<FullColdStartResult> {
    const steps: ColdStartStepResult[] = [];
    const coldStart = await runColdStart(options.coldStart ?? {});
    const counts = { ...DEFAULT_COUNTS, ...(options.counts ?? {}) };

    const { organizationRepository } = buildOrganizationServiceDependencies();
    const organization = await organizationRepository.getOrganization(coldStart.organizationId);
    if (!organization) {
        throw new Error('Cold start failed: platform organization not found after upsert.');
    }

    const roleName = options.coldStart?.roleName;
    const roleKey: OrgRoleKey = isOrgRoleKey(roleName) ? roleName : 'globalAdmin';

    const authorization = buildAuthorizationContext({
        orgId: organization.id,
        userId: coldStart.globalAdminUserId,
        roleKey,
        dataResidency: organization.dataResidency,
        dataClassification: organization.dataClassification,
        auditSource: 'bootstrap:cold-start',
        tenantScope: {
            orgId: organization.id,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
            auditSource: 'bootstrap:cold-start',
        },
    });

    await runStep(steps, 'roles.seed', async () => seedTenantRoles(organization.id, organization.dataClassification, organization.dataResidency));
    await runStep(steps, 'permissions.seed', async () => seedPermissions(organization.id, organization.dataClassification, organization.dataResidency));
    await runStep(steps, 'absence-types.seed', async () => seedDefaultAbsences(authorization));
    await runStep(steps, 'starter.seed', async () => seedStarterDataInternal());
    await runStep(steps, 'leave-policies.seed', async () => seedCommonLeavePoliciesInternal());
    await runStep(steps, 'compliance-templates.seed', async () => seedComplianceTemplates(authorization, options.forceComplianceTemplates ?? false));

    if (options.includeDemoData !== false) {
        await runStep(steps, 'employees.seed', async () => seedFakeEmployeesInternal(counts.employees));
        await runStep(steps, 'current-user-profile.seed', async () => seedCurrentUserProfileInternal(coldStart.globalAdminUserId));
        await runStep(steps, 'absences.seed', async () => seedFakeAbsencesInternal(counts.absences));
        await runStep(steps, 'time-entries.seed', async () => seedFakeTimeEntriesInternal(counts.timeEntries));
        await runStep(steps, 'training.seed', async () => seedFakeTrainingInternal(counts.training));
        await runStep(steps, 'performance.seed', async () => seedFakePerformanceInternal(counts.performance));
        await runStep(steps, 'notifications.seed', async () => seedFakeNotificationsInternal(counts.notifications));
        await runStep(steps, 'security-events.seed', async () => seedSecurityEventsInternal(counts.securityEvents));
        await runStep(steps, 'billing.seed', async () => seedBillingDataInternal());
        await runStep(steps, 'org-assets.seed', async () => seedOrgAssetsInternal());
        await runStep(steps, 'compliance.seed', async () => seedComplianceDataInternal());
        await runStep(steps, 'integrations.seed', async () => seedIntegrationsInternal());
    }

    const success = steps.every((step) => step.success);
    return { success, coldStart, steps };
}

async function seedTenantRoles(
    orgId: string,
    classification: DataClassificationLevel,
    residency: DataResidencyZone,
): Promise<{ success: boolean; message: string; count?: number }> {
    const { roleRepository } = buildRoleServiceDependencies();
    const existing = await roleRepository.getRolesByOrganization(orgId);
    const byName = new Map(existing.map((role) => [role.name, role]));
    let created = 0;

    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        if (byName.has(template.name)) {
            continue;
        }
        await roleRepository.createRole(orgId, {
            orgId,
            name: template.name,
            description: template.description,
            scope: template.scope,
            permissions: template.permissions as Role['permissions'],
            inheritsRoleIds: [],
            isSystem: template.isSystem ?? false,
            isDefault: template.isDefault ?? false,
        });
        created++;
    }

    const refreshed = await roleRepository.getRolesByOrganization(orgId);
    const refreshedByName = new Map(refreshed.map((role) => [role.name, role]));
    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        const role = refreshedByName.get(template.name);
        if (!role || !template.inherits?.length) {
            continue;
        }
        const inheritedRoleIds = template.inherits
            .map((name) => refreshedByName.get(name)?.id)
            .filter((id): id is string => typeof id === 'string');
        await roleRepository.updateRole(orgId, role.id, { inheritsRoleIds: inheritedRoleIds });
    }

    await invalidateOrgCache(orgId, CACHE_SCOPE_ROLES, classification, residency);
    return { success: true, message: 'Seeded tenant roles', count: created };
}

async function seedPermissions(
    orgId: string,
    classification: DataClassificationLevel,
    residency: DataResidencyZone,
): Promise<{ success: boolean; message: string; count?: number }> {
    const { permissionRepository } = buildPermissionResourceServiceDependencies();
    await seedPermissionResources({ permissionResourceRepository: permissionRepository }, { orgId });
    const resources = await permissionRepository.listResources(orgId);
    await invalidateOrgCache(orgId, CACHE_SCOPE_PERMISSIONS, classification, residency);
    return { success: true, message: 'Seeded permission resources', count: resources.length };
}

async function seedDefaultAbsences(authorization: Parameters<typeof seedDefaultAbsenceTypes>[1]['authorization']): Promise<{ success: boolean; message: string }> {
    const { absenceTypeConfigRepository } = buildAbsenceTypeConfigDependencies();
    await seedDefaultAbsenceTypes({ typeConfigRepository: absenceTypeConfigRepository }, { authorization });
    return { success: true, message: 'Seeded default absence types' };
}

async function seedComplianceTemplates(
    authorization: Parameters<typeof seedDefaultComplianceTemplates>[1]['authorization'],
    force: boolean,
): Promise<{ success: boolean; message: string }> {
    const { complianceTemplateRepository, complianceCategoryRepository } = buildComplianceRepositoryDependencies();
    const result = await seedDefaultComplianceTemplates(
        { complianceTemplateRepository, complianceCategoryRepository },
        { authorization, force },
    );
    const status = result.created ? 'created' : 'skipped';
    return { success: true, message: `Compliance template ${status}` };
}

async function runStep(
    steps: ColdStartStepResult[],
    step: string,
    action: () => Promise<{ success: boolean; message: string; count?: number }>,
): Promise<void> {
    try {
        const result = await action();
        steps.push({ step, success: result.success, message: result.message, count: result.count });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        steps.push({ step, success: false, message });
    }
}
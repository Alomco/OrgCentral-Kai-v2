import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type {
    ColdStartSeedPlanInput,
    ColdStartSeedPlanResponse,
    SeedCategoryId,
    SeedCategorySelection,
    SeedStepResult,
    SeedSummaryCounts,
} from '@/server/types/seeder/cold-start';
import { createEmptySeedSummaryCounts } from '@/lib/seed/cold-start-plan';
import {
    buildSeedAuthorization,
    buildSkippedStep,
    checkEmployeesAvailable,
    demoSelections,
    normalizeSelections,
    recordStep,
    resolveCount,
    runSeedStep,
} from './cold-start-plan.helpers';
import {
    seedComplianceTemplates,
    seedPermissions,
    seedTenantRoles,
} from './cold-start-plan.platform';
import {
    seedStarterDataInternal,
    seedCommonLeavePoliciesInternal,
} from '@/server/services/seeder/seed-starter-data';
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
import type { SeedContextOptions } from '@/server/services/seeder/utils';

interface ColdStartSeedPlanContext {
    authorization: RepositoryAuthorizationContext;
}

const EMPLOYEE_DEPENDENT_CATEGORIES: readonly SeedCategoryId[] = [
    'absences',
    'time-entries',
    'training',
    'performance',
    'compliance',
];

export async function runColdStartSeedPlan(
    input: ColdStartSeedPlanInput,
    context: ColdStartSeedPlanContext,
): Promise<ColdStartSeedPlanResponse> {
    const selections = normalizeSelections(input.platform, input.demo);
    const summary = createEmptySeedSummaryCounts();
    const steps: SeedStepResult[] = [];
    const seedAuthorization = buildSeedAuthorization(context.authorization);
    const seedOptions: SeedContextOptions = {
        orgId: seedAuthorization.orgId,
        userId: seedAuthorization.userId,
        auditSource: seedAuthorization.auditSource,
    };

    let hasEmployees = await checkEmployeesAvailable(seedAuthorization.orgId);

    await runPlatformEssentials(selections, steps, summary, seedAuthorization, seedOptions);

    if (selections.employees.enabled) {
        const result = await runSeedStep(selections.employees, () =>
            seedFakeEmployeesInternal(resolveCount(selections.employees), seedOptions),
        );
        recordStep(result, steps, summary);
        if (result.status === 'success') {
            hasEmployees = await checkEmployeesAvailable(seedAuthorization.orgId);
        }
    }

    for (const selection of demoSelections(selections)) {
        if (!selection.enabled || selection.id === 'employees') {
            continue;
        }

        if (EMPLOYEE_DEPENDENT_CATEGORIES.includes(selection.id) && !hasEmployees) {
            recordStep(
                buildSkippedStep(selection, 'Requires employees to be seeded first.'),
                steps,
                summary,
            );
            continue;
        }

        const stepResult = await runDemoSeed(selection, seedOptions);
        recordStep(stepResult, steps, summary);
    }

    const skipped = steps.filter((step) => step.status === 'skipped');
    const success = steps.every((step) => step.status !== 'failed');

    return {
        success,
        steps,
        summary: {
            totals: summary,
            skipped,
        },
    };
}

async function runPlatformEssentials(
    selections: Record<SeedCategoryId, SeedCategorySelection>,
    steps: SeedStepResult[],
    summary: SeedSummaryCounts,
    authorization: RepositoryAuthorizationContext,
    seedOptions: SeedContextOptions,
): Promise<void> {
    if (selections.roles.enabled) {
        recordStep(await runSeedStep(selections.roles, () => seedTenantRoles(authorization)), steps, summary);
    }

    if (selections.permissions.enabled) {
        recordStep(await runSeedStep(selections.permissions, () => seedPermissions(authorization)), steps, summary);
    }

    if (selections.starter.enabled) {
        recordStep(await runSeedStep(selections.starter, () => seedStarterDataInternal(seedOptions)), steps, summary);
    }

    if (selections['leave-policies'].enabled) {
        recordStep(
            await runSeedStep(selections['leave-policies'], () => seedCommonLeavePoliciesInternal(seedOptions)),
            steps,
            summary,
        );
    }

    if (selections['compliance-templates'].enabled) {
        const force = selections['compliance-templates'].dataset === 'full';
        recordStep(
            await runSeedStep(selections['compliance-templates'], () => seedComplianceTemplates(authorization, force)),
            steps,
            summary,
        );
    }
}

async function runDemoSeed(
    selection: SeedCategorySelection,
    seedOptions: SeedContextOptions,
): Promise<SeedStepResult> {
    switch (selection.id) {
        case 'roles':
        case 'permissions':
        case 'starter':
        case 'leave-policies':
        case 'compliance-templates':
        case 'employees':
            return buildSkippedStep(selection, 'Platform category not seeded in demo pass.');
        case 'absences':
            return runSeedStep(selection, () => seedFakeAbsencesInternal(resolveCount(selection), seedOptions));
        case 'time-entries':
            return runSeedStep(selection, () => seedFakeTimeEntriesInternal(resolveCount(selection), seedOptions));
        case 'training':
            return runSeedStep(selection, () => seedFakeTrainingInternal(resolveCount(selection), seedOptions));
        case 'performance':
            return runSeedStep(selection, () => seedFakePerformanceInternal(resolveCount(selection), seedOptions));
        case 'notifications':
            return runSeedStep(selection, () => seedFakeNotificationsInternal(resolveCount(selection), seedOptions));
        case 'security-events':
            return runSeedStep(selection, () => seedSecurityEventsInternal(resolveCount(selection), seedOptions));
        case 'billing':
            return runSeedStep(selection, () => seedBillingDataInternal(seedOptions));
        case 'org-assets':
            return runSeedStep(selection, () => seedOrgAssetsInternal(seedOptions));
        case 'compliance':
            return runSeedStep(selection, () => seedComplianceDataInternal(seedOptions));
        case 'integrations':
            return runSeedStep(selection, () => seedIntegrationsInternal(seedOptions));
    }
}


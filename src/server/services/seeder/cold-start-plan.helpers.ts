import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import { buildPeopleServiceDependencies } from '@/server/repositories/providers/hr/people-service-dependencies';
import type {
    SeedCategoryId,
    SeedCategorySelection,
    SeedStepResult,
    SeedSummaryCounts,
} from '@/server/types/seeder/cold-start';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { SEED_CATEGORY_MAP } from '@/lib/seed/cold-start-plan';

export function normalizeSelections(
    platformSelections: SeedCategorySelection[],
    demoSelections: SeedCategorySelection[],
): Record<SeedCategoryId, SeedCategorySelection> {
    const allSelections = [...platformSelections, ...demoSelections];
    return allSelections.reduce<Record<SeedCategoryId, SeedCategorySelection>>((accumulator, selection) => {
        accumulator[selection.id] = selection;
        return accumulator;
    }, createDefaultSelectionMap());
}

export function createDefaultSelectionMap(): Record<SeedCategoryId, SeedCategorySelection> {
    return {
        roles: { id: 'roles', enabled: false, dataset: 'minimal' },
        permissions: { id: 'permissions', enabled: false, dataset: 'minimal' },
        starter: { id: 'starter', enabled: false, dataset: 'minimal' },
        'leave-policies': { id: 'leave-policies', enabled: false, dataset: 'minimal' },
        'compliance-templates': { id: 'compliance-templates', enabled: false, dataset: 'minimal' },
        employees: { id: 'employees', enabled: false, dataset: 'minimal' },
        absences: { id: 'absences', enabled: false, dataset: 'minimal' },
        'time-entries': { id: 'time-entries', enabled: false, dataset: 'minimal' },
        training: { id: 'training', enabled: false, dataset: 'minimal' },
        performance: { id: 'performance', enabled: false, dataset: 'minimal' },
        notifications: { id: 'notifications', enabled: false, dataset: 'minimal' },
        'security-events': { id: 'security-events', enabled: false, dataset: 'minimal' },
        billing: { id: 'billing', enabled: false, dataset: 'minimal' },
        'org-assets': { id: 'org-assets', enabled: false, dataset: 'minimal' },
        compliance: { id: 'compliance', enabled: false, dataset: 'minimal' },
        integrations: { id: 'integrations', enabled: false, dataset: 'minimal' },
    };
}

export function demoSelections(
    selections: Record<SeedCategoryId, SeedCategorySelection>,
): SeedCategorySelection[] {
    return Object.values(selections).filter((selection) => SEED_CATEGORY_MAP[selection.id].group === 'demo');
}

export function resolveCount(selection: SeedCategorySelection): number {
    const category = SEED_CATEGORY_MAP[selection.id];
    if (!category.count) {
        return 0;
    }
    const fallback = category.count.defaults[selection.dataset];
    const value = selection.count ?? fallback;
    return Math.min(Math.max(value, category.count.min), category.count.max);
}

export async function runSeedStep(
    selection: SeedCategorySelection,
    action: () => Promise<{ success: boolean; message: string; count?: number }>,
): Promise<SeedStepResult> {
    try {
        const result = await action();
        return {
            id: selection.id,
            group: SEED_CATEGORY_MAP[selection.id].group,
            dataset: selection.dataset,
            status: result.success ? 'success' : 'failed',
            message: result.message,
            count: result.count,
        };
    } catch (error) {
        return {
            id: selection.id,
            group: SEED_CATEGORY_MAP[selection.id].group,
            dataset: selection.dataset,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export function buildSkippedStep(selection: SeedCategorySelection, message: string): SeedStepResult {
    return {
        id: selection.id,
        group: SEED_CATEGORY_MAP[selection.id].group,
        dataset: selection.dataset,
        status: 'skipped',
        message,
    };
}

export function recordStep(
    result: SeedStepResult,
    steps: SeedStepResult[],
    summary: SeedSummaryCounts,
): void {
    steps.push(result);
    summary[result.id] = result.count ?? 0;
}

export function buildSeedAuthorization(
    authorization: RepositoryAuthorizationContext,
): RepositoryAuthorizationContext {
    return buildAuthorizationContext({
        orgId: authorization.orgId,
        userId: authorization.userId,
        roleKey: authorization.roleKey,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        tenantScope: {
            orgId: authorization.orgId,
            dataResidency: authorization.dataResidency,
            dataClassification: authorization.dataClassification,
            auditSource: authorization.auditSource,
        },
    });
}

export async function checkEmployeesAvailable(orgId: string): Promise<boolean> {
    const { profileRepo } = buildPeopleServiceDependencies();
    const profiles = await profileRepo.getEmployeeProfilesByOrganization(orgId);
    return profiles.length > 0;
}

import { EntityNotFoundError } from '@/server/errors';
import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateLeaveCacheScopes } from '../shared/cache-helpers';
import {
    buildEmployeeContext,
    buildEntitlementMap,
    buildNormalizedSet,
    normalizeDate,
    PolicyCache,
    processAccruals,
    resolveDefaultLeaveTypes,
} from './sync-leave-accruals.helpers';

export interface SyncLeaveAccrualsDependencies {
    leaveBalanceRepository: ILeaveBalanceRepository;
    leavePolicyRepository: ILeavePolicyRepository;
    profileRepository: IEmployeeProfileRepository;
    organizationRepository: IOrganizationRepository;
}

export interface SyncLeaveAccrualsInput {
    authorization: RepositoryAuthorizationContext;
    referenceDate?: Date | string | number;
    employeeIds?: string[];
    leaveTypes?: string[];
    year?: number;
    dryRun?: boolean;
}

export interface SyncLeaveAccrualsResult {
    success: true;
    orgId: string;
    year: number;
    processedEmployees: number;
    balancesCreated: number;
    skippedEmployees: number;
    requestedEmployees?: number;
    missingEmployees?: string[];
    missingPolicies?: string[];
    dryRun: boolean;
}

export async function syncLeaveAccruals(
    deps: SyncLeaveAccrualsDependencies,
    input: SyncLeaveAccrualsInput,
): Promise<SyncLeaveAccrualsResult> {
    const referenceDate = normalizeDate(input.referenceDate) ?? new Date();
    const authorization = input.authorization;
    const org = await deps.organizationRepository.getOrganization(authorization.orgId);
    if (!org) {
        throw new EntityNotFoundError('Organization', { orgId: authorization.orgId });
    }

    const year = input.year ?? referenceDate.getUTCFullYear();
    const entitlementMap = buildEntitlementMap(org.leaveEntitlements);
    const defaultLeaveTypes = resolveDefaultLeaveTypes(entitlementMap, org.primaryLeaveType);
    const allowedLeaveTypes = buildNormalizedSet(input.leaveTypes);

    const employeeContext = await buildEmployeeContext(
        deps.profileRepository,
        authorization.orgId,
        input.employeeIds,
    );

    const policyCache = await PolicyCache.bootstrap(deps.leavePolicyRepository, authorization.tenantScope);
    const dryRun = Boolean(input.dryRun);

    const { processedEmployees, balancesCreated, skippedEmployees, missingPolicies } = await processAccruals({
        employees: employeeContext.targetedEmployees,
        authorization,
        year,
        dryRun,
        defaultLeaveTypes,
        allowedLeaveTypes,
        entitlementMap,
        leaveBalanceRepository: deps.leaveBalanceRepository,
        policyCache,
    });

    if (!dryRun && balancesCreated > 0) {
        await invalidateLeaveCacheScopes(authorization, 'balances');
    }

    return {
        success: true,
        orgId: authorization.orgId,
        year,
        processedEmployees,
        balancesCreated,
        skippedEmployees,
        requestedEmployees: input.employeeIds?.length,
        missingEmployees: employeeContext.missingEmployees.length ? employeeContext.missingEmployees : undefined,
        missingPolicies: missingPolicies.size ? Array.from(missingPolicies) : undefined,
        dryRun,
    };
}

import { randomUUID } from 'node:crypto';
import type { ILeaveBalanceRepository, LeaveBalanceCreateInput } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import type { LeavePolicy } from '@/server/types/leave-types';
import { normalizeLeaveType, toNumber } from './sync-leave-accruals.entitlements';
import type { PolicyCache } from './sync-leave-accruals.policy-cache';

export interface ProcessAccrualInput {
    employees: (EmployeeProfileDTO | undefined)[];
    authorization: RepositoryAuthorizationContext;
    year: number;
    dryRun: boolean;
    defaultLeaveTypes: string[];
    allowedLeaveTypes?: Set<string>;
    entitlementMap: Map<string, number>;
    leaveBalanceRepository: ILeaveBalanceRepository;
    policyCache: PolicyCache;
}

export interface ProcessAccrualSummary {
    processedEmployees: number;
    balancesCreated: number;
    skippedEmployees: number;
    missingPolicies: Set<string>;
}

export async function processAccruals({
    employees,
    authorization,
    year,
    dryRun,
    defaultLeaveTypes,
    allowedLeaveTypes,
    entitlementMap,
    leaveBalanceRepository,
    policyCache,
}: ProcessAccrualInput): Promise<ProcessAccrualSummary> {
    let processedEmployees = 0;
    let balancesCreated = 0;
    let skippedEmployees = 0;
    const missingPolicies = new Set<string>();

    for (const employee of employees) {
        const result = await processEmployee({
            employee,
            authorization,
            year,
            dryRun,
            defaultLeaveTypes,
            allowedLeaveTypes,
            entitlementMap,
            leaveBalanceRepository,
            policyCache,
        });

        if (result.status === 'skip') {
            skippedEmployees += 1;
            continue;
        }

        processedEmployees += 1;
        balancesCreated += result.balancesCreated;
        for (const policyName of result.missingPolicies) {
            missingPolicies.add(policyName);
        }
    }

    return {
        processedEmployees,
        balancesCreated,
        skippedEmployees,
        missingPolicies,
    };
}

interface ProcessEmployeeArguments {
    employee: EmployeeProfileDTO | undefined;
    authorization: RepositoryAuthorizationContext;
    year: number;
    dryRun: boolean;
    defaultLeaveTypes: string[];
    allowedLeaveTypes?: Set<string>;
    entitlementMap: Map<string, number>;
    leaveBalanceRepository: ILeaveBalanceRepository;
    policyCache: PolicyCache;
}

interface ProcessEmployeeResult {
    status: 'skip' | 'processed';
    balancesCreated: number;
    missingPolicies: string[];
}

async function processEmployee(args: ProcessEmployeeArguments): Promise<ProcessEmployeeResult> {
    const employeeRecord = args.employee;
    if (!employeeRecord?.employeeNumber) {
        return { status: 'skip', balancesCreated: 0, missingPolicies: [] };
    }
    const employeeNumber = employeeRecord.employeeNumber;

    const leaveTypes = resolveLeaveTypesForEmployee(
        employeeRecord,
        args.defaultLeaveTypes,
        args.allowedLeaveTypes,
    );

    if (leaveTypes.length === 0) {
        return { status: 'skip', balancesCreated: 0, missingPolicies: [] };
    }

    const existingBalances = await args.leaveBalanceRepository.getLeaveBalancesByEmployeeAndYear(
        args.authorization.tenantScope,
        employeeNumber,
        args.year,
    );
    const existingTypes = new Set(existingBalances.map((balance) => normalizeLeaveType(balance.leaveType)));

    let balancesCreated = 0;
    const missingPolicies: string[] = [];

    for (const leaveType of leaveTypes) {
        const normalizedType = normalizeLeaveType(leaveType);
        if (existingTypes.has(normalizedType)) {
            continue;
        }

        const policy = await args.policyCache.resolve(leaveType);
        if (!policy) {
            missingPolicies.push(leaveType);
            continue;
        }

        const entitlement = resolveEntitlement(args.entitlementMap, normalizedType, policy);
        const payload = buildLeaveBalancePayload({
            authorization: args.authorization,
            employeeNumber,
            leaveType,
            year: args.year,
            entitlement,
            policyId: policy.id,
        });

        if (!args.dryRun) {
            await args.leaveBalanceRepository.createLeaveBalance(args.authorization.tenantScope, payload);
        }
        balancesCreated += 1;
    }

    return {
        status: 'processed',
        balancesCreated,
        missingPolicies,
    };
}

interface LeaveBalancePayloadArguments {
    authorization: RepositoryAuthorizationContext;
    employeeNumber: string;
    leaveType: string;
    year: number;
    entitlement: number;
    policyId: string;
}

function buildLeaveBalancePayload(args: LeaveBalancePayloadArguments): LeaveBalanceCreateInput {
    return {
        id: randomUUID(),
        orgId: args.authorization.orgId,
        dataResidency: args.authorization.dataResidency,
        dataClassification: args.authorization.dataClassification,
        auditSource: args.authorization.auditSource,
        auditBatchId: args.authorization.auditBatchId,
        employeeId: args.employeeNumber,
        leaveType: args.leaveType,
        year: args.year,
        totalEntitlement: args.entitlement,
        used: 0,
        pending: 0,
        available: args.entitlement,
        policyId: args.policyId,
    };
}

function resolveLeaveTypesForEmployee(
    employee: EmployeeProfileDTO,
    defaultLeaveTypes: string[],
    allowedLeaveTypes?: Set<string>,
): string[] {
    const source = Array.isArray(employee.eligibleLeaveTypes) && employee.eligibleLeaveTypes.length > 0
        ? employee.eligibleLeaveTypes
        : defaultLeaveTypes;

    const deduped = new Map<string, string>();
    for (const rawType of source) {
        const trimmed = typeof rawType === 'string' ? rawType.trim() : '';
        if (!trimmed) {
            continue;
        }
        const normalized = normalizeLeaveType(trimmed);
        if (allowedLeaveTypes && !allowedLeaveTypes.has(normalized)) {
            continue;
        }
        if (!deduped.has(normalized)) {
            deduped.set(normalized, trimmed);
        }
    }

    return Array.from(deduped.values());
}

function resolveEntitlement(
    entitlements: Map<string, number>,
    normalizedLeaveType: string,
    policy: LeavePolicy,
): number {
    if (entitlements.has(normalizedLeaveType)) {
        return toNumber(entitlements.get(normalizedLeaveType), policy.accrualAmount ?? 0);
    }
    const fallback = policy.accrualAmount ?? 0;
    return toNumber(fallback, 0);
}

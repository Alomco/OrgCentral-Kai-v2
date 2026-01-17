// src/server/services/seeder/seed-starter-data.ts
import { LeaveAccrualFrequency, LeavePolicyType } from '@/server/types/prisma';
import { buildAbsenceServiceDependencies } from '@/server/repositories/providers/hr/absence-service-dependencies';
import { buildLeavePolicyServiceDependencies } from '@/server/repositories/providers/hr/leave-policy-service-dependencies';
import { buildDepartmentServiceDependencies } from '@/server/repositories/providers/org/department-service-dependencies';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

const DEFAULT_ANNUAL_POLICY = 'Annual Leave (Default)';
const DEFAULT_SICK_POLICY = 'Sick Leave';

export async function seedStarterDataInternal(options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const tenant = authorization.tenantScope;
        const { typeConfigRepository } = buildAbsenceServiceDependencies();
        const { leavePolicyRepository } = buildLeavePolicyServiceDependencies();
        const { departmentRepository } = buildDepartmentServiceDependencies();

        // 1. Seed Absence Types
        await seedDefaultAbsenceTypes(
            { typeConfigRepository },
            {
                authorization,
                dataResidency: authorization.dataResidency,
                dataClassification: authorization.dataClassification,
            },
        );

        // 2. Ensure Leave Policies
        const now = new Date().toISOString();
        const basePolicy = {
            orgId: org.id,
            activeFrom: now,
            dataResidency: org.dataResidency,
            dataClassification: org.dataClassification,
            auditSource: authorization.auditSource,
            metadata: getSeededMetadata(),
        };

        const annual = await leavePolicyRepository.getLeavePolicyByName(tenant, DEFAULT_ANNUAL_POLICY);
        if (!annual) {
            await leavePolicyRepository.createLeavePolicy(tenant, {
                ...basePolicy,
                name: DEFAULT_ANNUAL_POLICY,
                policyType: LeavePolicyType.ANNUAL,
                accrualFrequency: LeaveAccrualFrequency.YEARLY,
                accrualAmount: 28,
                carryOverLimit: 5,
                requiresApproval: true,
                isDefault: true,
            });
        }

        const sick = await leavePolicyRepository.getLeavePolicyByName(tenant, DEFAULT_SICK_POLICY);
        if (!sick) {
            await leavePolicyRepository.createLeavePolicy(tenant, {
                ...basePolicy,
                name: DEFAULT_SICK_POLICY,
                policyType: LeavePolicyType.SICK,
                accrualFrequency: LeaveAccrualFrequency.NONE,
                requiresApproval: false,
                statutoryCompliance: true,
                isDefault: false,
            });
        }

        // 3. Departments
        const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance', 'Legal', 'Operations'];
        for (const name of departments) {
            const existing = await departmentRepository.getDepartmentByCode(authorization, name);
            if (existing) {
                continue;
            }
            await departmentRepository.createDepartment(authorization, { orgId: org.id, name });
        }

        return { success: true, message: 'Starter data (Absence Types, Policies, Depts) seeded successfully.' };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}

export async function seedCommonLeavePoliciesInternal(options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const tenant = authorization.tenantScope;
        const { leavePolicyRepository } = buildLeavePolicyServiceDependencies();

        const policyDefinitions = [
            {
                name: DEFAULT_ANNUAL_POLICY,
                policyType: LeavePolicyType.ANNUAL,
                accrualFrequency: LeaveAccrualFrequency.MONTHLY,
                accrualAmount: 28,
                carryOverLimit: 5,
                requiresApproval: true,
                isDefault: true,
            },
            {
                name: DEFAULT_SICK_POLICY,
                policyType: LeavePolicyType.SICK,
                accrualFrequency: LeaveAccrualFrequency.NONE,
                accrualAmount: 10,
                requiresApproval: false,
                statutoryCompliance: true,
                allowNegativeBalance: true,
            },
            {
                name: 'Parental Leave',
                policyType: LeavePolicyType.SPECIAL,
                accrualFrequency: LeaveAccrualFrequency.YEARLY,
                accrualAmount: 52,
                requiresApproval: true,
                statutoryCompliance: true,
                maxConsecutiveDays: 365,
            },
            {
                name: 'Bereavement Leave',
                policyType: LeavePolicyType.EMERGENCY,
                accrualFrequency: LeaveAccrualFrequency.NONE,
                accrualAmount: 10,
                requiresApproval: true,
                statutoryCompliance: true,
                maxConsecutiveDays: 10,
            },
            {
                name: 'Unpaid Leave',
                policyType: LeavePolicyType.UNPAID,
                accrualFrequency: LeaveAccrualFrequency.NONE,
                requiresApproval: true,
                carryOverLimit: 0,
                maxConsecutiveDays: 30,
            },
        ];

        let created = 0;
        for (const policy of policyDefinitions) {
            const existing = await leavePolicyRepository.getLeavePolicyByName(tenant, policy.name);
            const metadata = getSeededMetadata({ template: 'common-leave-policies' });
            const updatePayload = {
                accrualFrequency: policy.accrualFrequency,
                accrualAmount: policy.accrualAmount,
                carryOverLimit: policy.carryOverLimit,
                requiresApproval: policy.requiresApproval,
                statutoryCompliance: policy.statutoryCompliance ?? false,
                isDefault: policy.isDefault ?? false,
                maxConsecutiveDays: policy.maxConsecutiveDays,
                allowNegativeBalance: policy.allowNegativeBalance ?? false,
                dataResidency: org.dataResidency,
                dataClassification: org.dataClassification,
                auditSource: authorization.auditSource,
                metadata,
            };

            if (existing) {
                await leavePolicyRepository.updateLeavePolicy(tenant, existing.id, updatePayload);
            } else {
                await leavePolicyRepository.createLeavePolicy(tenant, {
                    orgId: org.id,
                    name: policy.name,
                    policyType: policy.policyType,
                    accrualFrequency: policy.accrualFrequency,
                    accrualAmount: policy.accrualAmount,
                    carryOverLimit: policy.carryOverLimit,
                    requiresApproval: policy.requiresApproval,
                    statutoryCompliance: policy.statutoryCompliance ?? false,
                    isDefault: policy.isDefault ?? false,
                    maxConsecutiveDays: policy.maxConsecutiveDays,
                    allowNegativeBalance: policy.allowNegativeBalance ?? false,
                    activeFrom: new Date().toISOString(),
                    dataResidency: org.dataResidency,
                    dataClassification: org.dataClassification,
                    auditSource: authorization.auditSource,
                    metadata,
                });
            }
            created++;
        }

        return { success: true, message: `Seeded ${String(created)} common leave policies.`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}

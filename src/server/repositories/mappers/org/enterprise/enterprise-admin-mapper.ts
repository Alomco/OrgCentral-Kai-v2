import type {
    EnterpriseOnboardingInput,
    ModuleAccessUpdateInput,
} from '@/server/repositories/contracts/org/enterprise/enterprise-admin-repository-contract';
import type { ManagedOrganizationSummary, ManagedOrganizationRecord } from '@/server/types/enterprise-types';

export function mapManagedOrganizationRecordToDomain(record: ManagedOrganizationRecord): ManagedOrganizationSummary {
    const moduleAccess =
        record.moduleAccess && typeof record.moduleAccess === 'object' && !Array.isArray(record.moduleAccess)
            ? (record.moduleAccess as Record<string, boolean>)
            : {};
    return {
        orgId: record.orgId,
        orgName: record.orgName,
        ownerEmail: record.ownerEmail,
        planId: record.planId,
        moduleAccess,
        metadata: record.metadata ?? undefined,
        createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
    };
}

export function mapEnterpriseOnboardingInputToRecord(
    input: EnterpriseOnboardingInput,
): Omit<ManagedOrganizationRecord, 'createdAt' | 'updatedAt'> {
    return {
        orgId: input.orgId ?? '',
        orgName: input.orgName,
        ownerEmail: input.ownerEmail,
        planId: input.planId,
        moduleAccess: input.moduleAccess,
    };
}

export function mapModuleAccessUpdateToRecord(
    input: ModuleAccessUpdateInput,
): Pick<ManagedOrganizationRecord, 'moduleAccess'> {
    return { moduleAccess: input.moduleAccess };
}

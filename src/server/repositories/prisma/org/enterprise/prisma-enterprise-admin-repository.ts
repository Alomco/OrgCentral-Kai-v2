import { randomUUID } from 'node:crypto';
import type {
    EnterpriseOnboardingInput,
    IEnterpriseAdminRepository,
    ModuleAccessUpdateInput,
} from '@/server/repositories/contracts/org/enterprise/enterprise-admin-repository-contract';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import {
    mapEnterpriseOnboardingInputToRecord,
    mapManagedOrganizationRecordToDomain,
    mapModuleAccessUpdateToRecord,
} from '@/server/repositories/mappers/org/enterprise/enterprise-admin-mapper';
import type { ManagedOrganizationSummary } from '@/server/types/enterprise-types';
import { stampCreate, stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { invalidateOrgCache, registerOrgCacheTag } from '@/server/lib/cache-tags';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS } from '@/server/repositories/cache-scopes';
import { moduleAccessSchema } from '@/server/validators/org/enterprise/enterprise-validators';
import { Prisma, type PrismaClientInstance, type PrismaInputJsonValue } from '@/server/types/prisma';

type ManagedOrgDelegate = PrismaClientInstance['managedOrganization'];
type ManagedOrgCreateData = Prisma.ManagedOrganizationUncheckedCreateInput;
type ManagedOrgUpdateData = Prisma.ManagedOrganizationUncheckedUpdateInput;

export class PrismaEnterpriseAdminRepository
    extends BasePrismaRepository
    implements IEnterpriseAdminRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private get delegate(): ManagedOrgDelegate {
        return this.prisma.managedOrganization;
    }

    async onboardOrganization(input: EnterpriseOnboardingInput): Promise<ManagedOrganizationSummary> {
        const newOrgId = input.orgId ?? randomUUID();

        // Validate module access
        const validatedModuleAccess = moduleAccessSchema.parse(input.moduleAccess);

        const data: ManagedOrgCreateData = stampCreate({
            ...mapEnterpriseOnboardingInputToRecord(input),
            adminUserId: input.adminUserId,
            orgId: newOrgId,
            id: newOrgId,
            moduleAccess: toJsonNullInput(
                validatedModuleAccess as unknown as PrismaInputJsonValue,
            ),
            metadata: toJsonNullInput(null),
        });
        const record = await this.delegate.create({
            data,
        });
        registerOrgCacheTag(
            data.orgId,
            CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS,
            PrismaEnterpriseAdminRepository.DEFAULT_CLASSIFICATION,
            PrismaEnterpriseAdminRepository.DEFAULT_RESIDENCY,
        );
        return mapManagedOrganizationRecordToDomain(record);
    }

    async listManagedOrganizations(adminUserId: string): Promise<ManagedOrganizationSummary[]> {
        const records = await this.delegate.findMany({ where: { adminUserId } });
        return records.map(mapManagedOrganizationRecordToDomain);
    }

    async getManagedOrganization(
        adminUserId: string,
        orgId: string,
    ): Promise<ManagedOrganizationSummary | null> {
        const record = await this.delegate.findUnique({ where: { id: orgId } });
        if (!record || (record as { adminUserId?: string }).adminUserId !== adminUserId) {
            if (!record) { return null; }
            throw new RepositoryAuthorizationError('Managed organization access denied for this admin.');
        }
        registerOrgCacheTag(
            orgId,
            CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS,
            PrismaEnterpriseAdminRepository.DEFAULT_CLASSIFICATION,
            PrismaEnterpriseAdminRepository.DEFAULT_RESIDENCY,
        );
        return mapManagedOrganizationRecordToDomain(record);
    }

    async updateModuleAccess(input: ModuleAccessUpdateInput): Promise<ManagedOrganizationSummary> {
        // Validate module access
        const validatedModuleAccess = moduleAccessSchema.parse(input.moduleAccess);

        const data: ManagedOrgUpdateData = stampUpdate({
            ...mapModuleAccessUpdateToRecord(input),
            adminUserId: input.adminUserId,
            moduleAccess: toJsonNullInput(
                validatedModuleAccess as unknown as PrismaInputJsonValue,
            ),
        });
        const record = await this.delegate.update({
            where: { id: input.orgId },
            data,
        });
        await invalidateOrgCache(
            input.orgId,
            CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS,
            PrismaEnterpriseAdminRepository.DEFAULT_CLASSIFICATION,
            PrismaEnterpriseAdminRepository.DEFAULT_RESIDENCY,
        );
        return mapManagedOrganizationRecordToDomain(record);
    }
}

function toJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): PrismaInputJsonValue | typeof Prisma.JsonNull {
    const resolved = toPrismaInputJson(value);
    if (resolved === undefined || resolved === Prisma.DbNull) {
        return Prisma.JsonNull;
    }
    return resolved as PrismaInputJsonValue;
}

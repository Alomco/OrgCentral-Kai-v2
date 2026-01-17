import {
    PrismaTypes,
    type MembershipStatus,
    type PrismaInputJsonValue,
    type PrismaTransaction,
} from '@/server/types/prisma';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type {
    EmployeeProfilePayload,
    IMembershipRepository,
    MembershipCreationInput,
    MembershipCreationResult,
} from '@/server/repositories/contracts/org/membership';
import type { Membership } from '@/server/types/membership';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

const MEMBERSHIP_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'] as const;
type SafeMembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'] as const;
type SafeEmploymentType = (typeof EMPLOYMENT_TYPES)[number];

const ACTIVE_MEMBERSHIP_STATUS: SafeMembershipStatus = 'ACTIVE';
const DEFAULT_EMPLOYMENT_TYPE: SafeEmploymentType = 'FULL_TIME';

import {
    getModelDelegate,
    toPrismaInputJson,
    runTransaction,
    buildMembershipMetadataJson,
    type PrismaClientBase,
} from '@/server/repositories/prisma/helpers/prisma-utils';
import { resolveIdentityCacheScopes } from '@/server/lib/cache-tags/identity';

export class PrismaMembershipRepository extends OrgScopedPrismaRepository implements IMembershipRepository {

    async findMembership(context: RepositoryAuthorizationContext, userId: string): Promise<Membership | null> {
        const membership = await getModelDelegate(this.prisma, 'membership').findUnique({
            where: { orgId_userId: { orgId: context.orgId, userId } },
            include: { org: true, role: { select: { name: true } } },
        });

        if (!membership) {
            return null;
        }
        this.assertTenantRecord(membership, context);

        // Prefer optional chain for clarity and to preserve property access safety
        return {
            organizationId: membership.orgId,
            organizationName: membership.org.name,
            roles: membership.role?.name ? [membership.role.name] : [],
            status: membership.status,
        };
    }

    async createMembershipWithProfile(
        context: RepositoryAuthorizationContext,
        input: MembershipCreationInput,
    ): Promise<MembershipCreationResult> {
        const tenantOrgWhere = { orgId: context.orgId, userId: input.userId } as const;
        const profileData = this.mapProfilePayload({ ...input.profile, orgId: context.orgId });
        await runTransaction(this.prisma, async (tx: PrismaTransaction) => {
            const primaryRoleId = await resolvePrimaryRoleId(tx, context.orgId, input.roles);
            const baseMetadata = buildMembershipMetadataJson(context.tenantScope) as unknown as Record<
                string,
                PrismaInputJsonValue
            >;
            await getModelDelegate(tx, 'membership').create({
                data: {
                    orgId: context.orgId,
                    userId: input.userId,
                    status: ACTIVE_MEMBERSHIP_STATUS,
                    invitedBy: input.invitedByUserId,
                    invitedAt: new Date(),
                    activatedAt: new Date(),
                    createdBy: input.invitedByUserId ?? context.userId,
                    roleId: primaryRoleId ?? undefined,
                    metadata: toJsonNullInput(baseMetadata),
                },
            });

            await getModelDelegate(tx, 'employeeProfile').upsert({
                where: { orgId_userId: tenantOrgWhere },
                create: profileData,
                update: profileData,
            });

            await getModelDelegate(tx, 'user').update({
                where: { id: input.userId },
                data: input.userUpdate,
            });
        });
        await this.invalidateAfterWrite(context.orgId, resolveIdentityCacheScopes());
        return {
            organizationId: context.orgId,
            roles: input.roles,
        };
    }

    async updateMembershipStatus(
        context: RepositoryAuthorizationContext,
        userId: string,
        status: MembershipStatus,
    ): Promise<void> {
        const nextStatus = coerceMembershipStatus(status);
        const existing = await getModelDelegate(this.prisma, 'membership').findUnique({
            where: { orgId_userId: { orgId: context.orgId, userId } },
            select: { metadata: true },
        });

        const existingMetadata =
            existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
                ? (existing.metadata as Record<string, PrismaInputJsonValue>)
                : {};
        const baseMetadata = buildMembershipMetadataJson(context.tenantScope) as unknown as Record<
            string,
            PrismaInputJsonValue
        >;
        const nextMetadata = {
            ...existingMetadata,
            ...baseMetadata,
        };
        await getModelDelegate(this.prisma, 'membership').update({
            where: { orgId_userId: { orgId: context.orgId, userId } },
            data: {
                status: nextStatus,
                metadata: toJsonNullInput(nextMetadata),
                updatedBy: context.userId,
            },
        });
        await this.invalidateAfterWrite(context.orgId, resolveIdentityCacheScopes());
    }

    async countActiveMemberships(context: RepositoryAuthorizationContext): Promise<number> {
        const count = await getModelDelegate(this.prisma, 'membership').count({
            where: { orgId: context.orgId, status: ACTIVE_MEMBERSHIP_STATUS },
        });
        return count;
    }

    private mapProfilePayload(payload: EmployeeProfilePayload): EmployeeProfilePersistence {
        const employmentTypeInput =
            typeof payload.employmentType === 'string' ? payload.employmentType : null;
        const employmentType = coerceEmploymentType(employmentTypeInput);
        const metadataValue = toJsonNullInput(payload.metadata);
        return {
            orgId: payload.orgId,
            userId: payload.userId,
            employeeNumber: payload.employeeNumber,
            jobTitle: payload.jobTitle ?? null,
            employmentType,
            startDate: payload.startDate ?? null,
            metadata: metadataValue,
        };
    }

}

interface EmployeeProfilePersistence {
    orgId: string;
    userId: string;
    employeeNumber: string;
    jobTitle: string | null;
    employmentType: SafeEmploymentType;
    startDate: Date | null;
    metadata: PrismaInputJsonValue | typeof PrismaTypes.JsonNull | undefined;
}

// Delegate helper functions and runTransaction are provided by helper module `prisma-utils`

function coerceMembershipStatus(value: MembershipStatus | null | undefined): SafeMembershipStatus {
    if (value && (MEMBERSHIP_STATUSES as readonly string[]).includes(value)) {
        return value as SafeMembershipStatus;
    }

    throw new Error('Invalid membership status value received.');
}

function coerceEmploymentType(value: string | null | undefined): SafeEmploymentType {
    if (value && (EMPLOYMENT_TYPES as readonly string[]).includes(value)) {
        return value as SafeEmploymentType;
    }
    return DEFAULT_EMPLOYMENT_TYPE;
}

function toJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): PrismaInputJsonValue | typeof PrismaTypes.JsonNull | undefined {
    const resolved = toPrismaInputJson(value);
    if (resolved === PrismaTypes.DbNull) {
        return PrismaTypes.JsonNull;
    }
    return resolved as PrismaInputJsonValue | typeof PrismaTypes.JsonNull | undefined;
}

async function resolvePrimaryRoleId(
    prisma: PrismaClientBase,
    orgId: string,
    roles: string[],
): Promise<string | null> {
    if (!roles.length) {
        return null;
    }
    const primaryRoleName = roles[0];
    const role = await getModelDelegate(prisma, 'role').findUnique({
        where: { orgId_name: { orgId, name: primaryRoleName } },
        select: { id: true },
    });
    return role?.id ?? null;
}

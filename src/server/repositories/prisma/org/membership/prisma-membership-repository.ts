import type { Prisma, MembershipStatus } from '@prisma/client';
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
    extractRoles,
    runTransaction,
    buildMembershipMetadataJson,
} from '@/server/repositories/prisma/helpers/prisma-utils';
import { resolveIdentityCacheScopes } from '@/server/lib/cache-tags/identity';

export class PrismaMembershipRepository extends OrgScopedPrismaRepository implements IMembershipRepository {

    async findMembership(context: RepositoryAuthorizationContext, userId: string): Promise<Membership | null> {
        const membership = await getModelDelegate(this.prisma, 'membership').findUnique({
            where: { orgId_userId: { orgId: context.orgId, userId } },
            include: { org: true },
        });

        if (!membership) {
            return null;
        }
        this.assertTenantRecord(membership, context.orgId);

        // Prefer optional chain for clarity and to preserve property access safety
        return {
            organizationId: membership.orgId,
            organizationName: membership.org.name,
            roles: extractRoles(membership.metadata),
        };
    }

    async createMembershipWithProfile(
        context: RepositoryAuthorizationContext,
        input: MembershipCreationInput,
    ): Promise<MembershipCreationResult> {
        const tenantOrgWhere = { orgId: context.orgId, userId: input.userId } as const;
        const profileData = this.mapProfilePayload({ ...input.profile, orgId: context.orgId });
        await runTransaction(this.prisma, async (tx: Prisma.TransactionClient) => {
            await getModelDelegate(tx, 'membership').create({
                data: {
                    orgId: context.orgId,
                    userId: input.userId,
                    status: ACTIVE_MEMBERSHIP_STATUS,
                    invitedBy: input.invitedByUserId,
                    invitedAt: new Date(),
                    activatedAt: new Date(),
                    createdBy: input.invitedByUserId ?? '',
                    metadata: buildMembershipMetadataJson(context.tenantScope, input.roles),
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
        await getModelDelegate(this.prisma, 'membership').update({
            where: { orgId_userId: { orgId: context.orgId, userId } },
            data: { status: nextStatus },
        });
        await this.invalidateAfterWrite(context.orgId, resolveIdentityCacheScopes());
    }

    private mapProfilePayload(payload: EmployeeProfilePayload): EmployeeProfilePersistence {
        const employmentTypeInput =
            typeof payload.employmentType === 'string' ? payload.employmentType : null;
        const employmentType = coerceEmploymentType(employmentTypeInput);
        const metadataValue = toPrismaInputJson(payload.metadata);
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
    metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
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

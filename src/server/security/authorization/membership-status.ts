import { randomUUID } from 'node:crypto';
import type { IGuardMembershipRepository } from '@/server/repositories/contracts/security/guard-membership-repository-contract';
import { PrismaGuardMembershipRepository } from '@/server/repositories/prisma/security/guard/prisma-guard-membership-repository';

const ACTIVE_MEMBERSHIP_STATUSES = ['ACTIVE', 'INVITED'] as const;

let membershipRepository: IGuardMembershipRepository = new PrismaGuardMembershipRepository();

export interface RequireActiveMembershipOptions {
    allowedStatuses?: readonly string[];
    repository?: IGuardMembershipRepository;
    correlationId?: string;
}

export interface ActiveMembershipCheckResult {
    orgId: string;
    userId: string;
    status?: string;
    correlationId: string;
}

export async function requireActiveMembership(
    orgId: string,
    userId: string,
    options?: RequireActiveMembershipOptions,
): Promise<ActiveMembershipCheckResult> {
    const repository = options?.repository ?? membershipRepository;
    const membership = await repository.findMembership(orgId, userId);

    if (!membership) {
        throw new Error('Membership was not found for the requested organization.');
    }

    const status = extractStatus(membership.metadata);
    const allowedStatuses = new Set(options?.allowedStatuses ?? ACTIVE_MEMBERSHIP_STATUSES);

    if (status && !allowedStatuses.has(status)) {
        throw new Error('Membership is not active for this operation.');
    }

    return {
        orgId,
        userId,
        status,
        correlationId: options?.correlationId ?? randomUUID(),
    };
}

export function __setMembershipRepositoryForTests(repository: IGuardMembershipRepository): void {
    membershipRepository = repository;
}

export function __resetMembershipRepositoryForTests(): void {
    membershipRepository = new PrismaGuardMembershipRepository();
}

function extractStatus(metadata: Record<string, unknown> | null | undefined): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
        return undefined;
    }

    const value = metadata.status;
    return typeof value === 'string' ? value : undefined;
}

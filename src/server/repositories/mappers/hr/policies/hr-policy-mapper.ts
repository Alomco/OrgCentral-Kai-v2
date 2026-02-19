import type { HRPolicy, PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import type { PrismaJsonValue } from '@/server/types/prisma';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import type { Prisma } from '../../../../../generated/client';

type HRPolicyRecord = Omit<
    HRPolicy,
    'expiryDate' | 'applicableRoles' | 'applicableDepartments' | 'metadata'
> & {
    expiryDate?: Date | null;
    applicableRoles?: PrismaJsonValue | null;
    applicableDepartments?: PrismaJsonValue | null;
    metadata?: PrismaJsonValue | null;
};

type HRPolicyCreatePayload = Prisma.HRPolicyUncheckedCreateInput;
type HRPolicyUpdatePayload = Prisma.HRPolicyUncheckedUpdateManyInput;

type PolicyAcknowledgmentRecord = Omit<PolicyAcknowledgment, 'metadata'> & {
    metadata?: PrismaJsonValue | null;
};

type PolicyAckCreatePayload = Prisma.PolicyAcknowledgmentUncheckedCreateInput;

export function mapPrismaHRPolicyToDomain(record: HRPolicyRecord): HRPolicy {
    return {
        id: record.id,
        orgId: record.orgId,
        title: record.title,
        content: record.content,
        category: record.category,
        version: record.version,
        effectiveDate: record.effectiveDate,
        expiryDate: record.expiryDate ?? undefined,
        applicableRoles: record.applicableRoles ?? undefined,
        applicableDepartments: record.applicableDepartments ?? undefined,
        requiresAcknowledgment: record.requiresAcknowledgment,
        status: record.status,
        dataClassification: record.dataClassification,
        residencyTag: record.residencyTag,
        metadata: record.metadata ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export function mapDomainHRPolicyToPrismaCreate(
    orgId: string,
    input: Omit<HRPolicy, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>,
): HRPolicyCreatePayload {
    return {
        orgId,
        title: input.title,
        content: input.content,
        category: input.category,
        version: input.version,
        effectiveDate: input.effectiveDate,
        expiryDate: input.expiryDate ?? null,
        applicableRoles: toPrismaInputJson(input.applicableRoles),
        applicableDepartments: toPrismaInputJson(input.applicableDepartments),
        requiresAcknowledgment: input.requiresAcknowledgment,
        status: input.status,
        dataClassification: input.dataClassification,
        residencyTag: input.residencyTag,
        metadata: toPrismaInputJson(input.metadata),
    } satisfies HRPolicyCreatePayload;
}

export function mapDomainHRPolicyToPrismaUpdate(
    updates: Partial<
        Pick<
            HRPolicy,
            | 'title'
            | 'content'
            | 'category'
            | 'version'
            | 'effectiveDate'
            | 'expiryDate'
            | 'applicableRoles'
            | 'applicableDepartments'
            | 'requiresAcknowledgment'
            | 'status'
            | 'dataClassification'
            | 'residencyTag'
            | 'metadata'
        >
    >,
): HRPolicyUpdatePayload {
    const payload: HRPolicyUpdatePayload = {};

    if (updates.title !== undefined) {
        payload.title = updates.title;
    }
    if (updates.content !== undefined) {
        payload.content = updates.content;
    }
    if (updates.category !== undefined) {
        payload.category = updates.category;
    }
    if (updates.version !== undefined) {
        payload.version = updates.version;
    }
    if (updates.effectiveDate !== undefined) {
        payload.effectiveDate = updates.effectiveDate;
    }
    if ('expiryDate' in updates) {
        payload.expiryDate = updates.expiryDate ?? null;
    }
    if (updates.applicableRoles !== undefined) {
        payload.applicableRoles = toPrismaInputJson(updates.applicableRoles);
    }
    if (updates.applicableDepartments !== undefined) {
        payload.applicableDepartments = toPrismaInputJson(updates.applicableDepartments);
    }
    if (updates.requiresAcknowledgment !== undefined) {
        payload.requiresAcknowledgment = updates.requiresAcknowledgment;
    }
    if (updates.status !== undefined) {
        payload.status = updates.status;
    }
    if (updates.dataClassification !== undefined) {
        payload.dataClassification = updates.dataClassification;
    }
    if (updates.residencyTag !== undefined) {
        payload.residencyTag = updates.residencyTag;
    }
    if (updates.metadata !== undefined) {
        payload.metadata = toPrismaInputJson(updates.metadata);
    }

    return payload;
}

export function mapPrismaPolicyAckToDomain(record: PolicyAcknowledgmentRecord): PolicyAcknowledgment {
    return {
        id: record.id,
        orgId: record.orgId,
        userId: record.userId,
        policyId: record.policyId,
        version: record.version,
        acknowledgedAt: record.acknowledgedAt,
        ipAddress: record.ipAddress ?? undefined,
        metadata: record.metadata ?? undefined,
    };
}

export function mapDomainPolicyAckToPrismaCreate(
    input: Omit<PolicyAcknowledgment, 'id'>,
): PolicyAckCreatePayload {
    return {
        orgId: input.orgId,
        userId: input.userId,
        policyId: input.policyId,
        version: input.version,
        acknowledgedAt: input.acknowledgedAt,
        ipAddress: input.ipAddress ?? null,
        metadata: toPrismaInputJson(input.metadata),
    } satisfies PolicyAckCreatePayload;
}

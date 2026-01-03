import { AuthorizationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { MembershipStatus } from '@prisma/client';

export const ORG_MEMBERSHIP_RESOURCE_TYPE = 'org.membership';

type MembershipAuditAction = 'roles.updated' | 'status.updated';

interface MembershipAuditPayload {
    targetUserId: string;
    roles?: string[];
    status?: MembershipStatus;
}

export async function recordMembershipAuditEvent(
    authorization: RepositoryAuthorizationContext,
    targetUserId: string,
    payload: MembershipAuditPayload,
    action: MembershipAuditAction,
): Promise<void> {
    const auditPayload: Record<string, unknown> = {
        targetUserId: payload.targetUserId,
        ...(payload.roles ? { roles: payload.roles } : {}),
        ...(payload.status ? { status: payload.status } : {}),
    };

    await recordAuditEvent({
        orgId: authorization.orgId,
        userId: authorization.userId,
        eventType: 'DATA_CHANGE',
        action: `membership.${action}`,
        resource: ORG_MEMBERSHIP_RESOURCE_TYPE,
        resourceId: targetUserId,
        payload: auditPayload,
        correlationId: authorization.correlationId,
        residencyZone: authorization.dataResidency,
        classification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        auditBatchId: authorization.auditBatchId,
    });
}

export function enforceInviteRolePolicy(
    authorization: RepositoryAuthorizationContext,
    roles: string[],
): void {
    const primaryRole = roles[0] ?? 'member';
    const roleKey = authorization.roleKey;

    if (roleKey === 'globalAdmin' || roleKey === 'owner') {
        if (primaryRole !== 'orgAdmin') {
            throw new AuthorizationError('Global admins may only invite organization admins.');
        }
        return;
    }

    if (roleKey === 'orgAdmin') {
        if (primaryRole !== 'hrAdmin') {
            throw new AuthorizationError('Organization admins may only invite HR admins.');
        }
        return;
    }

    if (roleKey === 'hrAdmin') {
        if (primaryRole !== 'member') {
            throw new AuthorizationError('HR admins may only invite members.');
        }
        return;
    }

    throw new AuthorizationError('You are not permitted to invite users with this role.');
}

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HRPolicy } from '@/server/types/hr-ops-types';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';

export type PolicyUpdateEvent = 'created' | 'updated';

export interface EmitPolicyUpdateNotificationsInput {
    authorization: RepositoryAuthorizationContext;
    policy: HRPolicy;
    event: PolicyUpdateEvent;
    employeeProfileRepository: IEmployeeProfileRepository;
    excludeUserId?: string;
}

function extractStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const items: string[] = [];
    for (const entry of value) {
        if (typeof entry !== 'string') {
            return null;
        }
        const trimmed = entry.trim();
        if (!trimmed) {
            continue;
        }
        items.push(trimmed);
    }

    return items;
}

interface PolicyApplicability {
    includeAll: boolean;
    roles: string[];
    departments: string[];
}

function resolvePolicyApplicability(policy: HRPolicy): PolicyApplicability {
    const roles = extractStringArray(policy.applicableRoles) ?? [];
    const departments = extractStringArray(policy.applicableDepartments) ?? [];

    return {
        includeAll: roles.length === 0 && departments.length === 0,
        roles,
        departments,
    };
}

function matchesPolicyApplicability(profile: { roles?: string[]; departmentId?: string | null }, applicability: PolicyApplicability): boolean {
    if (applicability.includeAll) {
        return true;
    }

    if (applicability.roles.length > 0) {
        const profileRoles = profile.roles ?? [];
        if (!profileRoles.some((role) => applicability.roles.includes(role))) {
            return false;
        }
    }

    if (applicability.departments.length > 0) {
        const departmentId = profile.departmentId ?? undefined;
        if (!departmentId || !applicability.departments.includes(departmentId)) {
            return false;
        }
    }

    return true;
}

export async function emitPolicyUpdateNotifications(
    input: EmitPolicyUpdateNotificationsInput,
): Promise<void> {
    const profiles = await input.employeeProfileRepository.getEmployeeProfilesByOrganization(
        input.authorization.orgId,
        { employmentStatus: 'ACTIVE' as const },
    );

    const applicability = resolvePolicyApplicability(input.policy);

    const recipients = new Set<string>();
    for (const profile of profiles) {
        if (!profile.userId) {
            continue;
        }
        if (input.excludeUserId && profile.userId === input.excludeUserId) {
            continue;
        }

        if (!matchesPolicyApplicability(profile, applicability)) {
            continue;
        }

        recipients.add(profile.userId);
    }

    const title = input.event === 'created' ? 'New HR policy published' : 'HR policy published';
    const message = `${input.policy.title} (v${input.policy.version}) is now available.`;

    for (const userId of recipients) {
        await emitHrNotification(
            {},
            {
                authorization: input.authorization,
                notification: {
                    userId,
                    title,
                    message,
                    type: 'policy-update',
                    priority: 'medium',
                    actionUrl: '/hr/policies',
                    metadata: {
                        event: input.event,
                        policyId: input.policy.id,
                        policyVersion: input.policy.version,
                        category: input.policy.category,
                        status: input.policy.status,
                        effectiveDate: input.policy.effectiveDate.toISOString(),
                        expiryDate: input.policy.expiryDate ? input.policy.expiryDate.toISOString() : null,
                        requiresAcknowledgment: input.policy.requiresAcknowledgment,
                    },
                },
            },
        );
    }
}

export interface EmitPolicyAcknowledgedNotificationInput {
    authorization: RepositoryAuthorizationContext;
    policy: HRPolicy;
    userId: string;
    acknowledgedAt: Date;
}

export async function emitPolicyAcknowledgedNotification(
    input: EmitPolicyAcknowledgedNotificationInput,
): Promise<void> {
    await emitHrNotification(
        {},
        {
            authorization: input.authorization,
            notification: {
                userId: input.userId,
                title: 'Policy acknowledged',
                message: `You acknowledged ${input.policy.title} (v${input.policy.version}).`,
                type: 'policy-update',
                priority: 'low',
                actionUrl: '/hr/policies',
                metadata: {
                    event: 'acknowledged',
                    policyId: input.policy.id,
                    policyVersion: input.policy.version,
                    acknowledgedAt: input.acknowledgedAt.toISOString(),
                },
            },
        },
    );
}

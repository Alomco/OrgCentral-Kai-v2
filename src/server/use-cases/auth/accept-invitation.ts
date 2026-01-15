import { EntityNotFoundError } from '@/server/errors';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import {
    normalizeActor,
    normalizeToken,
} from '@/server/use-cases/shared';
import {
    assertInvitationCanBeAccepted,
    resolveInvitationRoles,
    resolveOrganization,
} from '@/server/use-cases/auth/accept-invitation.context';
import {
    ensureMembershipAndOnboarding,
} from '@/server/use-cases/auth/accept-invitation.membership';

export interface AcceptInvitationDependencies {
    invitationRepository: IInvitationRepository;
    userRepository: IUserRepository;
    membershipRepository?: IMembershipRepository;
    organizationRepository?: IOrganizationRepository;
    employeeProfileRepository?: IEmployeeProfileRepository;
    checklistTemplateRepository?: IChecklistTemplateRepository;
    checklistInstanceRepository?: IChecklistInstanceRepository;
    generateEmployeeNumber?: () => string;
}

export interface AcceptInvitationInput {
    token: string;
    actor: {
        userId: string;
        email: string;
    };
    correlationId?: string;
    request?: {
        ipAddress?: string;
        userAgent?: string;
    };
}

export interface AcceptInvitationResult {
    success: true;
    organizationId: string;
    organizationName: string;
    roles: string[];
    alreadyMember: boolean;
    employeeNumber?: string;
}

export async function acceptInvitation(
    deps: AcceptInvitationDependencies,
    input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
    const token = normalizeToken(input.token);
    const actor = normalizeActor(input.actor);

    const record = await deps.invitationRepository.findByToken(token);
    if (!record) {
        throw new EntityNotFoundError('Invitation', { token });
    }

    assertInvitationCanBeAccepted(record, actor.email, token);

    const membershipRoles = resolveInvitationRoles(record);
    const membershipOutcome = await ensureMembershipAndOnboarding(deps, record, actor, membershipRoles);

    await deps.invitationRepository.updateStatus(token, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedByUserId: actor.userId,
    });

    const organization = await resolveOrganization(deps.organizationRepository, record.organizationId);

    await recordAuditEvent({
        orgId: record.organizationId,
        userId: actor.userId,
        eventType: 'AUTH',
        action: 'org.invitation.accepted',
        resource: 'org.invitation',
        resourceId: record.organizationId,
        residencyZone: organization?.dataResidency,
        classification: organization?.dataClassification,
        auditSource: organization ? 'auth.accept-invitation' : undefined,
        correlationId: input.correlationId,
        payload: {
            alreadyMember: membershipOutcome.alreadyMember,
            roleCount: membershipRoles.length,
            ipAddress: input.request?.ipAddress,
            userAgent: input.request?.userAgent,
        },
    });

    return {
        success: true,
        organizationId: record.organizationId,
        organizationName: record.organizationName,
        roles: membershipRoles,
        alreadyMember: membershipOutcome.alreadyMember,
        employeeNumber: membershipOutcome.employeeNumber,
    };
}



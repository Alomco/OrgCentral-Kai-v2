import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { AcceptInvitationDependencies } from '@/server/use-cases/auth/accept-invitation';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { NormalizedActor } from '@/server/use-cases/shared';
import { buildAuthorizationContext } from '@/server/use-cases/shared';
import {
    buildEmployeeProfilePayload,
    buildUserActivationPayload,
    defaultEmployeeNumberGenerator,
    resolvePreboardingProfilePayload,
    maybeInstantiateChecklistInstance,
    extractEmployeeNumber,
} from '@/server/use-cases/auth/accept-invitation.helpers';
import { buildMembershipContext } from '@/server/use-cases/auth/accept-invitation.context';

export interface MembershipOutcome {
    alreadyMember: boolean;
    employeeNumber?: string;
}

export async function ensureMembershipAndOnboarding(
    deps: AcceptInvitationDependencies,
    record: InvitationRecord,
    actor: NormalizedActor,
    roles: string[],
): Promise<MembershipOutcome> {
    const existingUser = await deps.userRepository.getUser(record.organizationId, actor.userId);
    const alreadyMember = existingUser?.memberOf.includes(record.organizationId) ?? false;

    if (alreadyMember) {
        return { alreadyMember: true };
    }

    if (deps.membershipRepository && deps.organizationRepository) {
        const context = await buildMembershipContext(
            deps.organizationRepository,
            record.organizationId,
            actor.userId,
        );

        const preboardingProfile = await resolvePreboardingProfilePayload(
            deps.employeeProfileRepository,
            record,
            actor.userId,
        );
        const profilePayload =
            preboardingProfile ??
            buildEmployeeProfilePayload(
                record,
                actor.userId,
                deps.generateEmployeeNumber ?? defaultEmployeeNumberGenerator,
            );
        const userUpdate = buildUserActivationPayload(record);

        await deps.membershipRepository.createMembershipWithProfile(context, {
            userId: actor.userId,
            invitedByUserId: record.invitedByUserId ?? record.invitedByUid,
            roles,
            profile: profilePayload,
            userUpdate,
        });

        await maybeInstantiateChecklistInstance({
            record,
            employeeNumber: profilePayload.employeeNumber,
            templateRepository: deps.checklistTemplateRepository,
            instanceRepository: deps.checklistInstanceRepository,
        });

        return { alreadyMember: false, employeeNumber: profilePayload.employeeNumber };
    }

    const fallbackContext: RepositoryAuthorizationContext = deps.organizationRepository
        ? await buildMembershipContext(deps.organizationRepository, record.organizationId, actor.userId)
        : buildAuthorizationContext({
            orgId: record.organizationId,
            userId: actor.userId,
            roleKey: 'custom',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'accept-invitation:fallback',
            tenantScope: {
                orgId: record.organizationId,
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                auditSource: 'accept-invitation:fallback',
            },
        });

    await deps.userRepository.addUserToOrganization(
        fallbackContext,
        actor.userId,
        record.organizationId,
        record.organizationName,
        roles,
    );

    const fallbackEmployeeNumber = extractEmployeeNumber(record);
    await maybeInstantiateChecklistInstance({
        record,
        employeeNumber: fallbackEmployeeNumber,
        templateRepository: deps.checklistTemplateRepository,
        instanceRepository: deps.checklistInstanceRepository,
    });

    return { alreadyMember: false, employeeNumber: fallbackEmployeeNumber };
}

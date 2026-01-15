import { ValidationError } from '@/server/errors';
import type { AcceptInvitationResult } from '@/server/use-cases/auth/accept-invitation';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { assertDependency } from '@/server/use-cases/shared';
import { updateMembershipRoles as updateMembershipRolesUseCase } from '@/server/use-cases/org/membership/update-membership-roles';
import type { Membership } from '@/server/types/membership';
import { sendBulkRoleUpdateNotifications, sendRoleUpdateNotification } from './membership-service.notifications';
import { normalizeInviteRoles, runAcceptInvitation } from './membership-service.accept';
import type {
  AcceptInvitationExecutor,
  AcceptInvitationServiceInput,
  MembershipServiceDependencies,
} from './membership-service.types';
import { invalidateIdentityCache } from './membership-service.helpers';
import {
  enforceInviteRolePolicy,
  ORG_MEMBERSHIP_RESOURCE_TYPE,
  recordMembershipAuditEvent,
} from './membership-service.policy';
import { buildMetadata } from '@/server/use-cases/shared/builders';

interface MembershipServiceContext {
  dependencies: MembershipServiceDependencies;
  ensureOrgAccess: (authorization: RepositoryAuthorizationContext, params: {
    action: string;
    resourceType: string;
    resourceAttributes?: Record<string, unknown>;
    requiredPermissions?: Record<string, string[]>;
  }) => Promise<void>;
  buildContext: (authorization: RepositoryAuthorizationContext, options?: { correlationId?: string; metadata?: Record<string, unknown> }) => ServiceExecutionContext;
  executeInServiceContext: <T>(context: ServiceExecutionContext, action: string, handler: () => Promise<T>) => Promise<T>;
}

export function buildAcceptInvitationExecutor(service: MembershipServiceContext): AcceptInvitationExecutor {
  return {
    buildContext: (authorization, options) => service.buildContext(authorization, options),
    execute: (context, action, handler) => service.executeInServiceContext(context, action, handler),
  };
}

export async function handleUpdateMembershipRoles(service: MembershipServiceContext, input: {
  authorization: RepositoryAuthorizationContext;
  targetUserId: string;
  roles: string[];
}): Promise<Membership> {
  await service.ensureOrgAccess(input.authorization, {
    action: 'org.membership.update-roles',
    resourceType: ORG_MEMBERSHIP_RESOURCE_TYPE,
    resourceAttributes: {
      targetUserId: input.targetUserId,
      roles: input.roles,
    },
  });

  const context = service.buildContext(input.authorization, {
    correlationId: input.authorization.correlationId,
    metadata: { targetUserId: input.targetUserId },
  });

  return service.executeInServiceContext(context, 'identity.update-roles', async () => {
    const { membership } = await updateMembershipRolesUseCase(
      { userRepository: service.dependencies.userRepository },
      {
        authorization: input.authorization,
        targetUserId: input.targetUserId,
        roles: input.roles,
      },
    );
    await invalidateIdentityCache(input.authorization);
    await recordMembershipAuditEvent(
      input.authorization,
      input.targetUserId,
      {
        targetUserId: input.targetUserId,
        roles: membership.roles,
      },
      'roles.updated',
    );

    await sendRoleUpdateNotification(
      service.dependencies.notificationComposer,
      input.authorization,
      input.targetUserId,
      input.roles,
    );

    return membership;
  });
}

export async function handleBulkUpdateMembershipRoles(service: MembershipServiceContext, input: {
  authorization: RepositoryAuthorizationContext;
  targetUserIds: string[];
  roles: string[];
}): Promise<void> {
  await service.ensureOrgAccess(input.authorization, {
    action: 'org.membership.bulk-update-roles',
    resourceType: ORG_MEMBERSHIP_RESOURCE_TYPE,
    resourceAttributes: {
      targetUserIds: input.targetUserIds,
      roles: input.roles,
    },
  });

  const context = service.buildContext(input.authorization, {
    correlationId: input.authorization.correlationId,
    metadata: { userCount: input.targetUserIds.length },
  });

  await service.executeInServiceContext(context, 'identity.bulk-update-roles', async () => {
    const updates = input.targetUserIds.map(async (targetUserId) => {
      const { membership } = await updateMembershipRolesUseCase(
        { userRepository: service.dependencies.userRepository },
        {
          authorization: input.authorization,
          targetUserId,
          roles: input.roles,
        },
      );
      return { targetUserId, membership };
    });

    const results = await Promise.all(updates);

    await invalidateIdentityCache(input.authorization);

    await sendBulkRoleUpdateNotifications(
      service.dependencies.notificationComposer,
      input.authorization,
      results.map(({ targetUserId }) => targetUserId),
      input.roles,
    );
  });
}

export async function handleInviteMember(service: MembershipServiceContext, input: {
  authorization: RepositoryAuthorizationContext;
  email: string;
  roles: string[];
  request?: {
    ipAddress?: string;
    userAgent?: string;
    securityContext?: Record<string, unknown>;
  };
}): Promise<{ token: string; alreadyInvited: boolean }> {
  await service.ensureOrgAccess(input.authorization, {
    action: 'org.invitation.create',
    resourceType: 'org.invitation',
    resourceAttributes: {
      email: input.email,
      roles: input.roles,
    },
    requiredPermissions: { member: ['invite'] },
  });

  const invitationRepository = service.dependencies.invitationRepository;
  const organizationRepository = service.dependencies.organizationRepository;
  assertDependency(invitationRepository, 'invitationRepository');

  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedRoles = normalizeInviteRoles(input.roles);
  enforceInviteRolePolicy(input.authorization, normalizedRoles);

  const existing = await invitationRepository.getActiveInvitationByEmail(
    input.authorization.orgId,
    normalizedEmail,
  );

  if (existing) {
    return { token: existing.token, alreadyInvited: true };
  }

  const organization = await organizationRepository?.getOrganization(input.authorization.orgId);
  const organizationName = organization?.name ?? input.authorization.orgId;

  const context = service.buildContext(input.authorization, {
    correlationId: input.authorization.correlationId,
    metadata: { email: normalizedEmail, roles: normalizedRoles },
  });

  return service.executeInServiceContext(context, 'identity.invite-member', async () => {
    if (!normalizedEmail) {
      throw new ValidationError('Email is required to invite a member.', { email: input.email });
    }

    const invitation = await invitationRepository.createInvitation({
      orgId: input.authorization.orgId,
      organizationName,
      targetEmail: normalizedEmail,
      invitedByUserId: input.authorization.userId,
      onboardingData: {
        email: normalizedEmail,
        displayName: '',
        roles: normalizedRoles,
      },
      metadata: {
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
      },
      securityContext: input.request?.securityContext
        ? buildMetadata(input.request.securityContext)
        : undefined,
      ipAddress: input.request?.ipAddress,
      userAgent: input.request?.userAgent,
    });

    return { token: invitation.token, alreadyInvited: false };
  });
}

export async function runInvitationAcceptance(
  service: MembershipServiceContext,
  input: AcceptInvitationServiceInput,
): Promise<AcceptInvitationResult> {
  const executor = buildAcceptInvitationExecutor(service);
  return runAcceptInvitation(service.dependencies, executor, input);
}

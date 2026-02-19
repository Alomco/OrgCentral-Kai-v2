import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { ValidationError } from '@/server/errors';
import { MembershipStatus } from '../../../../generated/client';

const AUDIT_SOURCE = 'api:org:membership:update';

const updateMembershipSchema = z
  .object({
    roles: z.array(z.string().min(1)).optional(),
    status: z.enum(MembershipStatus).optional(),
  })
  .refine((value) => (value.roles ?? value.status) !== undefined, {
    message: 'At least one of roles or status must be provided.',
  });

export async function updateMembershipController(request: Request, orgId: string, userId: string) {
  const normalizedOrgId = orgId.trim();
  const normalizedUserId = userId.trim();
  if (!normalizedOrgId) {
    throw new ValidationError('Organization id is required.');
  }
  if (!normalizedUserId) {
    throw new ValidationError('User id is required.');
  }

  const body = await readJson(request);
  const input = updateMembershipSchema.parse(body);

  const { authorization } = await getSessionContext(
    {},
    {
      headers: request.headers,
      orgId: normalizedOrgId,
      requiredPermissions: { member: ['update'] },
      auditSource: AUDIT_SOURCE,
      action: 'org.membership.update',
      resourceType: 'org.membership',
      resourceAttributes: { targetUserId: normalizedUserId, updateKeys: Object.keys(body ?? {}) },
    },
  );

  const service = getMembershipService();

  if (input.roles) {
    await service.updateMembershipRoles({
      authorization,
      targetUserId: normalizedUserId,
      roles: input.roles,
    });
  }

  if (input.status === MembershipStatus.SUSPENDED) {
    await service.suspendMembership({ authorization, targetUserId: normalizedUserId });
  } else if (input.status === MembershipStatus.ACTIVE) {
    await service.resumeMembership({ authorization, targetUserId: normalizedUserId });
  }

  return {
    success: true as const,
  };
}

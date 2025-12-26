'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { resolveOrgContext } from '@/server/org/org-context';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { normalizeRoleList, type MemberActionState } from './shared';

const updateMemberRolesSchema = z
    .object({
        targetUserId: z.string().trim().min(1),
        roles: z.string().trim().min(1),
    })
    .strict();

export async function updateMemberRolesAction(
    _previous: MemberActionState,
    formData: FormData,
): Promise<MemberActionState> {
    void _previous;
    const orgContext = await resolveOrgContext();
    const headerStore = await headers();

    const parsed = updateMemberRolesSchema.safeParse({
        targetUserId: formData.get('targetUserId') ?? '',
        roles: formData.get('roles') ?? '',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid role update input.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            orgId: orgContext.orgId,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-members:update-roles',
        },
    );

    const roles = normalizeRoleList(parsed.data.roles);

    try {
        await getMembershipService().updateMembershipRoles({
            authorization,
            targetUserId: parsed.data.targetUserId,
            roles,
        });
        return { status: 'success', message: 'Member roles updated.' };
    } catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : 'Failed to update roles.' };
    }
}

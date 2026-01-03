"use server";

import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { normalizeRoleList, type MemberActionState } from './shared';

const BULK_MEMBER_INTENT_UPDATE_ROLES = 'update-roles' as const;
const BULK_MEMBER_INTENT_SUSPEND = 'suspend' as const;
const BULK_MEMBER_INTENT_RESUME = 'resume' as const;
const BULK_MEMBER_INTENTS = [
    BULK_MEMBER_INTENT_UPDATE_ROLES,
    BULK_MEMBER_INTENT_SUSPEND,
    BULK_MEMBER_INTENT_RESUME,
] as const;

const bulkMemberActionSchema = z
    .object({
        intent: z.enum(BULK_MEMBER_INTENTS),
        roles: z.string().trim().optional(),
        userIds: z.array(z.string().trim().min(1)).min(1),
    })
    .strict();

export async function bulkMemberAction(
    _previous: MemberActionState,
    formData: FormData,
): Promise<MemberActionState> {
    void _previous;
    const headerStore = await headers();

    const userIds = formData
        .getAll('userIds')
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    const parsed = bulkMemberActionSchema.safeParse({
        intent: formData.get('intent'),
        roles: typeof formData.get('roles') === 'string' ? formData.get('roles') : undefined,
        userIds,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Select at least one member and a bulk action.' };
    }

    if (parsed.data.intent === BULK_MEMBER_INTENT_UPDATE_ROLES && !parsed.data.roles) {
        return { status: 'error', message: 'Select a role for bulk updates.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-members:bulk',
        },
    );
    const bulkAuthorization = { ...authorization, auditBatchId: randomUUID() };

    const membershipService = getMembershipService();
    let successCount = 0;
    let failureCount = 0;

    for (const targetUserId of parsed.data.userIds) {
        try {
            if (parsed.data.intent === BULK_MEMBER_INTENT_UPDATE_ROLES) {
                const roles = normalizeRoleList(parsed.data.roles ?? '');
                await membershipService.updateMembershipRoles({
                    authorization: bulkAuthorization,
                    targetUserId,
                    roles,
                });
            } else if (parsed.data.intent === BULK_MEMBER_INTENT_SUSPEND) {
                await membershipService.suspendMembership({ authorization: bulkAuthorization, targetUserId });
            } else {
                await membershipService.resumeMembership({ authorization: bulkAuthorization, targetUserId });
            }
            successCount += 1;
        } catch {
            failureCount += 1;
        }
    }

    if (failureCount > 0) {
        return {
            status: 'error',
            message: `Updated ${String(successCount)} members; ${String(failureCount)} failed.`,
        };
    }

    return {
        status: 'success',
        message: `Updated ${String(successCount)} members.`,
    };
}

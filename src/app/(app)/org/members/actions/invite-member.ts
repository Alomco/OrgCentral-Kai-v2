'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { resolveOrgContext } from '@/server/org/org-context';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import type { AbacSubjectAttributes } from '@/server/types/abac-subject-attributes';
import { parseAbacSubjectAttributes, type InviteMemberActionState } from './shared';

const inviteMemberSchema = z
    .object({
        email: z.email(),
        role: z.string().trim().min(1),
        abacSubjectAttributesJson: z.string().trim().optional(),
    })
    .strict();

export async function inviteMemberAction(
    _previous: InviteMemberActionState,
    formData: FormData,
): Promise<InviteMemberActionState> {
    void _previous;
    const orgContext = await resolveOrgContext();
    const headerStore = await headers();

    const parsed = inviteMemberSchema.safeParse({
        email: formData.get('email') ?? '',
        role: formData.get('role') ?? '',
        abacSubjectAttributesJson: formData.get('abacSubjectAttributesJson') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid invitation input.' };
    }

    const abacSubjectAttributes = parseAbacSubjectAttributes(parsed.data.abacSubjectAttributesJson);
    if (parsed.data.abacSubjectAttributesJson && !abacSubjectAttributes) {
        return { status: 'error', message: 'ABAC subject attributes must be valid JSON (object of primitives/arrays).' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            orgId: orgContext.orgId,
            requiredPermissions: { member: ['invite'] },
            auditSource: 'ui:org-members:invite',
            action: 'invite',
            resourceType: 'org.invitation',
            resourceAttributes: {
                email: parsed.data.email,
                role: parsed.data.role,
            },
        },
    );

    try {
        const inviteResultSchema = z
            .object({
                token: z.string().trim().min(1),
                alreadyInvited: z.boolean(),
            })
            .strict();

        const getMembershipServiceTyped = getMembershipService as () => {
            inviteMember(input: {
                authorization: RepositoryAuthorizationContext;
                email: string;
                roles: string[];
                abacSubjectAttributes?: AbacSubjectAttributes;
            }): Promise<{ token: string; alreadyInvited: boolean }>;
        };
        const membershipService = getMembershipServiceTyped();
        const result = inviteResultSchema.parse(
            await membershipService.inviteMember({
                authorization,
                email: parsed.data.email,
                roles: [parsed.data.role],
                abacSubjectAttributes: abacSubjectAttributes ?? undefined,
            }),
        );

        return {
            status: 'success',
            message: result.alreadyInvited ? 'An active invitation already exists for this email.' : 'Invitation created.',
            token: result.token,
            alreadyInvited: result.alreadyInvited,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to invite member.',
        };
    }
}

import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';
import { resendInvitationEmail } from '@/server/use-cases/notifications/resend-invitation-email';
import { listOrgInvitations } from '@/server/use-cases/auth/invitations/list-org-invitations';
import { revokeOrgInvitation } from '@/server/use-cases/auth/invitations/revoke-org-invitation';
import { ValidationError } from '@/server/errors';

const statusSchema = z.enum(['pending', 'accepted', 'expired', 'declined', 'revoked']);

const listQuerySchema = z.object({
    status: statusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

const revokeSchema = z.object({
    reason: z.string().trim().min(1).optional(),
});

const AUDIT_LIST = 'api:org:invitations:list';
const AUDIT_REVOKE = 'api:org:invitations:revoke';
const AUDIT_RESEND = 'api:org:invitations:resend';
const RESOURCE_TYPE_INVITATION = 'org.invitation';

function normalizeOrgId(orgId: string): string {
    const trimmed = orgId.trim();
    if (!trimmed) {
        throw new ValidationError('Organization id is required.');
    }
    return trimmed;
}

function normalizeToken(token: string): string {
    const trimmed = token.trim();
    if (!trimmed) {
        throw new ValidationError('Invitation token is required.');
    }
    return trimmed;
}

export async function listInvitationsController(request: Request, orgId: string) {
    const normalizedOrgId = normalizeOrgId(orgId);
    const url = new URL(request.url);
    const parsed = listQuerySchema.parse({
        status: url.searchParams.get('status') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined,
    });

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { member: ['invite'] },
            auditSource: AUDIT_LIST,
            action: 'org.invitation.list',
            resourceType: RESOURCE_TYPE_INVITATION,
        },
    );

    const invitationRepository = new PrismaInvitationRepository();
    return listOrgInvitations(
        { invitationRepository },
        {
            authorization,
            status: parsed.status,
            limit: parsed.limit,
        },
    );
}

export async function revokeInvitationController(request: Request, orgId: string, token: string) {
    const normalizedOrgId = normalizeOrgId(orgId);
    const normalizedToken = normalizeToken(token);
    const body = await readJson(request);
    const parsed = revokeSchema.parse(body ?? {});

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { member: ['invite'] },
            auditSource: AUDIT_REVOKE,
            action: 'org.invitation.revoke',
            resourceType: RESOURCE_TYPE_INVITATION,
            resourceAttributes: { token: normalizedToken },
        },
    );

    const invitationRepository = new PrismaInvitationRepository();
    return revokeOrgInvitation(
        { invitationRepository },
        {
            authorization,
            token: normalizedToken,
            reason: parsed.reason,
        },
    );
}

export async function resendInvitationController(request: Request, orgId: string, token: string) {
    const normalizedOrgId = normalizeOrgId(orgId);
    const normalizedToken = normalizeToken(token);

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { member: ['invite'] },
            auditSource: AUDIT_RESEND,
            action: 'org.invitation.resend',
            resourceType: RESOURCE_TYPE_INVITATION,
            resourceAttributes: { token: normalizedToken },
        },
    );

    const dependencies = getInvitationEmailDependencies();
    return resendInvitationEmail(dependencies, {
        authorization,
        invitationToken: normalizedToken,
    });
}

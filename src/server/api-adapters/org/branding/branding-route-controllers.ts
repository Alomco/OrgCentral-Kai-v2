import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { ValidationError } from '@/server/errors';
import { readJson } from '@/server/api-adapters/http/request-utils';
import type { OrgPermissionMap } from '@/server/security/access-control';

import {
    getOrgBrandingWithPrisma,
    updateOrgBrandingWithPrisma,
    resetOrgBrandingWithPrisma,
} from '@/server/use-cases/org/branding/branding-composition';

const AUDIT_SOURCE = {
    get: 'api:org:branding:get',
    update: 'api:org:branding:update',
    reset: 'api:org:branding:reset',
} as const;

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';
const REQUIRED_PERMISSIONS: OrgPermissionMap = { organization: ['update'] };
const RESOURCE_TYPE = 'org.branding' as const;

const updateBrandingSchema = z
    .object({
        logoUrl: z.string().trim().min(1).max(2048).nullable().optional(),
        faviconUrl: z.string().trim().min(1).max(2048).nullable().optional(),
        companyName: z.string().trim().min(1).max(120).nullable().optional(),
        primaryColor: z.string().trim().min(1).max(32).nullable().optional(),
        secondaryColor: z.string().trim().min(1).max(32).nullable().optional(),
        accentColor: z.string().trim().min(1).max(32).nullable().optional(),
        customCss: z.string().max(25000).nullable().optional(),
    })
    .strict();

export async function getOrgBrandingController(request: Request, orgId: string) {
    const normalizedOrgId = orgId.trim();
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: REQUIRED_PERMISSIONS,
            auditSource: AUDIT_SOURCE.get,
            action: 'org.branding.read',
            resourceType: RESOURCE_TYPE,
            resourceAttributes: { orgId: normalizedOrgId },
        },
    );

    return getOrgBrandingWithPrisma({ authorization, orgId: normalizedOrgId });
}

export async function updateOrgBrandingController(request: Request, orgId: string) {
    const normalizedOrgId = orgId.trim();
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const body = await readJson(request);
    const updates = updateBrandingSchema.parse(body);

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: REQUIRED_PERMISSIONS,
            auditSource: AUDIT_SOURCE.update,
            action: 'org.branding.update',
            resourceType: RESOURCE_TYPE,
            resourceAttributes: { orgId: normalizedOrgId, keys: Object.keys(updates) },
        },
    );

    return updateOrgBrandingWithPrisma({
        authorization,
        orgId: normalizedOrgId,
        updates,
    });
}

export async function resetOrgBrandingController(request: Request, orgId: string) {
    const normalizedOrgId = orgId.trim();
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: REQUIRED_PERMISSIONS,
            auditSource: AUDIT_SOURCE.reset,
            action: 'org.branding.reset',
            resourceType: RESOURCE_TYPE,
            resourceAttributes: { orgId: normalizedOrgId },
        },
    );

    return resetOrgBrandingWithPrisma({
        authorization,
        orgId: normalizedOrgId,
    });
}

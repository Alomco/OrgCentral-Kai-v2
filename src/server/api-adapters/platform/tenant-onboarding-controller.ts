import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import { onboardPlatformTenant } from '@/server/use-cases/platform/tenants/onboard-platform-tenant';
import { buildPlatformTenantOnboardingDependencies } from '@/server/use-cases/platform/tenants/onboard-platform-tenant.provider';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';

const payloadSchema = z.object({
    organization: z.object({
        name: z.string().trim().min(2),
        slug: z.string().trim().min(2),
        regionCode: z.string().trim().min(2),
        dataResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
        dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    }),
    owner: z.object({
        email: z.email(),
        displayName: z.string().trim().min(1).max(120).optional(),
        userId: z.string().trim().optional(),
    }),
});

export interface PlatformTenantOnboardingResult {
    success: true;
    organizationId: string;
    invitationToken?: string;
}

export async function onboardPlatformTenantController(request: Request): Promise<PlatformTenantOnboardingResult> {
    const payload = payloadSchema.parse(await readJson(request));

    const { authorization } = await getSessionContext({}, {
        headers: request.headers,
        requiredPermissions: { platformSettings: ['update'] },
        auditSource: 'api:platform:tenant-onboarding',
        action: 'create',
        resourceType: 'platform.tenant',
        resourceAttributes: {
            slug: payload.organization.slug,
        },
    });

    const deps = buildPlatformTenantOnboardingDependencies();

    const requestContext = buildInvitationRequestSecurityContext({
        authorization,
        headers: request.headers,
        action: 'platform.tenant.onboard',
        targetEmail: payload.owner.email,
    });

    const result = await onboardPlatformTenant(deps, {
        authorization,
        organization: payload.organization,
        owner: payload.owner,
        request: requestContext,
    });

    return {
        success: true,
        organizationId: result.organization.id,
        invitationToken: result.invitationToken,
    };
}

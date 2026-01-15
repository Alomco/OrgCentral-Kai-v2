import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';
import { moduleAccessSchema } from '@/server/validators/org/enterprise/enterprise-validators';
import { onboardEnterpriseTenant } from '@/server/use-cases/platform/tenants/onboard-enterprise-tenant';
import { buildEnterpriseTenantOnboardingDependencies } from '@/server/use-cases/platform/tenants/onboard-enterprise-tenant.provider';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';
import type { ManagedOrganizationSummary } from '@/server/types/enterprise-types';

const payloadSchema = z.object({
    organization: z.object({
        name: z.string().trim().min(2),
        slug: z.string().trim().min(2),
        regionCode: z.string().trim().min(2),
        dataResidency: z.enum(DATA_RESIDENCY_ZONES),
        dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
    }),
    owner: z.object({
        email: z.email(),
        displayName: z.string().trim().min(1).max(120).optional(),
        userId: z.string().trim().optional(),
    }),
    planId: z.string().trim().min(1),
    moduleAccess: moduleAccessSchema,
});

export interface EnterpriseTenantOnboardingResult {
    success: true;
    organizationId: string;
    managedOrganization: ManagedOrganizationSummary;
    invitationToken?: string;
}

export async function onboardEnterpriseTenantController(
    request: Request,
): Promise<EnterpriseTenantOnboardingResult> {
    const payload = payloadSchema.parse(await readJson(request));

    const { authorization } = await getSessionContext({}, {
        headers: request.headers,
        requiredPermissions: { platformSettings: ['update'] },
        expectedResidency: payload.organization.dataResidency,
        expectedClassification: payload.organization.dataClassification,
        auditSource: 'api:platform:enterprise-onboarding',
        action: 'create',
        resourceType: 'platform.enterpriseTenant',
        resourceAttributes: {
            slug: payload.organization.slug,
            planId: payload.planId,
        },
    });

    const deps = buildEnterpriseTenantOnboardingDependencies();

    const requestContext = buildInvitationRequestSecurityContext({
        authorization,
        headers: request.headers,
        action: 'platform.enterprise.onboard',
        targetEmail: payload.owner.email,
    });

    const result = await onboardEnterpriseTenant(deps, {
        authorization,
        organization: payload.organization,
        owner: payload.owner,
        planId: payload.planId,
        moduleAccess: payload.moduleAccess,
        request: requestContext,
    });

    return {
        success: true,
        organizationId: result.organization.id,
        managedOrganization: result.managedOrganization,
        invitationToken: result.invitationToken,
    };
}

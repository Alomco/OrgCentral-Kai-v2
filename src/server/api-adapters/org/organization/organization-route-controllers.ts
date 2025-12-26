import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { ValidationError } from '@/server/errors';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { readJson } from '../../http/request-utils';
import { organizationProfileUpdateSchema } from '../../../validators/org/organization-profile';
import {
    organizationCreateSchema,
    type OrganizationCreateInput,
} from '../../../validators/org/organization-create';

import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { PrismaRoleRepository } from '@/server/repositories/prisma/org/roles/prisma-role-repository';
import { PrismaMembershipRepository } from '@/server/repositories/prisma/org/membership/prisma-membership-repository';
import { getOrganization as getOrganizationUseCaseImpl } from '@/server/use-cases/org/organization/get-organization';
import type { GetOrganizationResult } from '@/server/use-cases/org/organization/get-organization';
import { createOrganizationWithOwner as createOrganizationWithOwnerUseCase } from '@/server/use-cases/org/organization/create-organization-with-owner';
import type { CreateOrganizationWithOwnerResult } from '@/server/use-cases/org/organization/create-organization-with-owner';
import { updateOrganizationProfile as updateOrganizationProfileUseCaseImpl } from '@/server/use-cases/org/organization/update-profile';
import type {
    UpdateOrganizationProfileResult,
} from '@/server/use-cases/org/organization/update-profile';


const AUDIT_SOURCE = {
    get: 'api:org:organization:get',
    updateProfile: 'api:org:organization:update-profile',
    create: 'api:org:organization:create',
} as const;

const ORG_ID_REQUIRED_MESSAGE = 'Organization id is required.';

const ORG_ORGANIZATION_RESOURCE_TYPE = 'org.organization';


export async function getOrganizationController(
    request: Request,
    orgId: string,
): Promise<GetOrganizationResult> {
    const normalizedOrgId = orgId.trim();
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { organization: ['read'] },
            auditSource: AUDIT_SOURCE.get,
            action: 'org.organization.read',
            resourceType: ORG_ORGANIZATION_RESOURCE_TYPE,
            resourceAttributes: { orgId: normalizedOrgId },
        },
    );

    const repository = new PrismaOrganizationRepository();
    return getOrganizationUseCaseImpl(
        { organizationRepository: repository },
        {
            authorization,
            orgId: normalizedOrgId,
        },
    );
}

export async function updateOrganizationProfileController(
    request: Request,
    orgId: string,
): Promise<UpdateOrganizationProfileResult> {
    const normalizedOrgId = orgId.trim();
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const body = await readJson(request);
    const updates = organizationProfileUpdateSchema.parse(body);

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { organization: ['update'] },
            auditSource: AUDIT_SOURCE.updateProfile,
            action: 'org.organization.update',
            resourceType: ORG_ORGANIZATION_RESOURCE_TYPE,
            resourceAttributes: { orgId: normalizedOrgId },
        },
    );

    const repository = new PrismaOrganizationRepository();
    return updateOrganizationProfileUseCaseImpl(
        { organizationRepository: repository },
        {
            authorization,
            orgId: normalizedOrgId,
            updates,
        },
    );
}

export async function createOrganizationController(
    request: Request,
): Promise<CreateOrganizationWithOwnerResult> {
    const orgIdHeader = request.headers.get('x-org-id');
    const normalizedOrgId = orgIdHeader?.trim() ?? '';
    if (!normalizedOrgId) {
        throw new ValidationError(ORG_ID_REQUIRED_MESSAGE);
    }

    const body = await readJson<OrganizationCreateInput>(request);
    const payload = organizationCreateSchema.parse(body);

    const resourceAttributes = {
        tenantId: normalizedOrgId,
        slug: payload.slug,
        regionCode: payload.regionCode,
        ...(payload.dataResidency ? { dataResidency: payload.dataResidency } : {}),
        ...(payload.dataClassification ? { dataClassification: payload.dataClassification } : {}),
    };

    const { authorization, session } = await getSessionContext(
        {},
        {
            headers: request.headers,
            orgId: normalizedOrgId,
            requiredPermissions: { organization: ['create'] },
            expectedResidency: payload.dataResidency,
            expectedClassification: payload.dataClassification,
            auditSource: AUDIT_SOURCE.create,
            action: 'org.organization.create',
            resourceType: 'org.organization',
            resourceAttributes,
        },
    );

    const { email } = requireSessionUser(session);
    if (!email || email.trim().length === 0) {
        throw new ValidationError('Authenticated user email is required to create an organization.');
    }

    const displayName =
        typeof session.user.name === 'string' && session.user.name.trim().length > 0
            ? session.user.name.trim()
            : undefined;

    const organizationRepository = new PrismaOrganizationRepository();
    const roleRepository = new PrismaRoleRepository();
    const membershipRepository = new PrismaMembershipRepository();

    return createOrganizationWithOwnerUseCase(
        {
            organizationRepository,
            roleRepository,
            membershipRepository,
        },
        {
            authorization,
            actor: {
                userId: authorization.userId,
                email,
                displayName,
            },
            organization: {
                slug: payload.slug,
                name: payload.name,
                regionCode: payload.regionCode,
                tenantId: authorization.orgId,
                dataResidency: payload.dataResidency ?? authorization.dataResidency,
                dataClassification: payload.dataClassification ?? authorization.dataClassification,
            },
        },
    );
}
